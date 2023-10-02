package workspacebundlestore

import (
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getParamsFromWorkspace(workspace *meta.Workspace) map[string]string {
	return map[string]string{
		"workspaceid": workspace.ID,
	}
}

func processItems(items []meta.BundleableItem, workspace *meta.Workspace, connection adapt.Connection, looper func(meta.Item, []adapt.ReferenceLocator, string) error) error {
	if workspace == nil {
		return errors.New("Workspace bundle store, needs a workspace in context")
	}
	collectionLocatorMap := map[string]adapt.LocatorMap{}
	namespace := workspace.GetAppFullName()

	for _, item := range items {
		collectionName := item.GetBundleFolderName()
		dbID := item.GetDBID(workspace.UniqueKey)
		_, ok := collectionLocatorMap[collectionName]
		if !ok {
			collectionLocatorMap[collectionName] = adapt.LocatorMap{}
		}
		locatorMap := collectionLocatorMap[collectionName]
		locatorMap.AddID(dbID, adapt.ReferenceLocator{
			Item: item,
		})
	}

	for collectionName, locatorMap := range collectionLocatorMap {
		group, err := meta.GetBundleableGroupFromType(collectionName)
		if err != nil {
			return err
		}

		err = datasource.PlatformLoad(&WorkspaceLoadCollection{
			Collection: group,
			Namespace:  namespace,
		}, &datasource.PlatformLoadOptions{
			LoadAll:    true,
			Connection: connection,
			Params:     getParamsFromWorkspace(workspace),
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    adapt.UNIQUE_KEY_FIELD,
					Value:    locatorMap.GetIDs(),
					Operator: "IN",
				},
			}}, sess.GetStudioAnonSession())
		if err != nil {
			return err
		}

		err = group.Loop(func(item meta.Item, _ string) error {
			bundleable := item.(meta.BundleableItem)
			dbID := bundleable.GetDBID(workspace.UniqueKey)
			match, ok := locatorMap[dbID]
			if !ok {
				return looper(item, nil, dbID)
			}
			// Remove the id from the map, so we can figure out which ones weren't used
			delete(locatorMap, dbID)
			return looper(item, match, dbID)
		})
		if err != nil {
			return err
		}
		// If we still have values in our idMap, then we didn't find some of our references.
		for id, locator := range locatorMap {
			return looper(nil, locator, id)
		}
		return nil

	}
	return nil
}

type WorkspaceBundleStore struct{}

func (b *WorkspaceBundleStore) GetConnection(options bundlestore.ConnectionOptions) (bundlestore.BundleStoreConnection, error) {
	if options.Workspace == nil {
		return nil, errors.New("Workspace bundle store, needs a workspace in context")
	}
	return &WorkspaceBundleStoreConnection{
		ConnectionOptions: options,
	}, nil
}

type WorkspaceBundleStoreConnection struct {
	bundlestore.ConnectionOptions
}

func (b *WorkspaceBundleStoreConnection) GetItem(item meta.BundleableItem) error {

	item.SetNamespace(b.Namespace)

	return datasource.PlatformLoadOne(item, &datasource.PlatformLoadOptions{
		Conditions: []adapt.LoadRequestCondition{
			{
				Field: adapt.UNIQUE_KEY_FIELD,
				Value: item.GetDBID(b.Workspace.UniqueKey),
			},
		},
		Params:     getParamsFromWorkspace(b.Workspace),
		Connection: b.Connection,
	}, sess.GetStudioAnonSession())
}

func (b *WorkspaceBundleStoreConnection) HasAny(group meta.BundleableGroup, conditions meta.BundleConditions) (bool, error) {
	err := b.GetAllItems(group, conditions)
	if err != nil {
		return false, err
	}
	return group.Len() > 0, nil
}

func (b *WorkspaceBundleStoreConnection) GetManyItems(items []meta.BundleableItem) error {
	return processItems(items, b.Workspace, b.Connection, func(item meta.Item, locators []adapt.ReferenceLocator, id string) error {
		if locators == nil {
			return errors.New("Found an item we weren't expecting")
		}
		if item == nil {
			return fmt.Errorf("Could not find workspace item: " + id)
		}
		for _, locator := range locators {
			meta.Copy(locator.Item, item)
		}
		return nil
	})
}

func (b *WorkspaceBundleStoreConnection) GetAllItems(group meta.BundleableGroup, conditions meta.BundleConditions) error {

	// Add the workspace id as a condition
	loadConditions := make([]adapt.LoadRequestCondition, len(conditions), len(conditions))
	i := 0
	for field, value := range conditions {
		loadConditions[i] = adapt.LoadRequestCondition{
			Field: field,
			Value: value,
		}
		i++
	}

	return datasource.PlatformLoad(&WorkspaceLoadCollection{
		Collection: group,
		Namespace:  b.Namespace,
	}, &datasource.PlatformLoadOptions{
		Conditions: loadConditions,
		Params:     getParamsFromWorkspace(b.Workspace),
		Connection: b.Connection,
		LoadAll:    true,
		Orders: []adapt.LoadRequestOrder{{
			Field: adapt.UNIQUE_KEY_FIELD,
		}},
	}, sess.GetStudioAnonSession())

}

func (b *WorkspaceBundleStoreConnection) GetItemAttachment(item meta.AttachableItem, path string) (time.Time, io.ReadSeeker, error) {
	modTime := time.Time{}
	err := b.GetItem(item)
	if err != nil {
		return modTime, nil, err
	}
	recordID, err := item.GetField(adapt.ID_FIELD)
	if err != nil {
		return modTime, nil, err
	}
	stream, _, err := filesource.DownloadAttachment(recordID.(string), path, sess.GetStudioAnonSession())
	if err != nil {
		return modTime, nil, err
	}
	return modTime, stream, nil
}

func (b *WorkspaceBundleStoreConnection) GetAttachmentPaths(item meta.AttachableItem) ([]string, error) {

	err := b.GetItem(item)
	if err != nil {
		return nil, err
	}
	recordID, err := item.GetField(adapt.ID_FIELD)
	if err != nil {
		return nil, err
	}
	userFiles := &meta.UserFileMetadataCollection{}
	err = datasource.PlatformLoad(
		userFiles,
		&datasource.PlatformLoadOptions{
			Params: getParamsFromWorkspace(b.Workspace),
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/core.recordid",
					Value: recordID,
				},
			},
		},
		sess.GetStudioAnonSession(),
	)
	if err != nil {
		return nil, err
	}
	paths := []string{}
	for _, ufm := range *userFiles {
		paths = append(paths, ufm.Path)
	}
	return paths, nil
}

func (b *WorkspaceBundleStoreConnection) StoreItem(path string, reader io.Reader) error {
	return errors.New("Tried to store items in the workspace bundle store")
}

func (b *WorkspaceBundleStoreConnection) DeleteBundle() error {
	return errors.New("Tried to delete bundle in the workspace bundle store")
}

func (b *WorkspaceBundleStoreConnection) GetBundleDef() (*meta.BundleDef, error) {

	var by meta.BundleDef
	by.Name = b.Namespace
	bdc := meta.BundleDependencyCollection{}
	err := datasource.PlatformLoad(
		&bdc,
		&datasource.PlatformLoadOptions{
			Connection: b.Connection,
			Params:     getParamsFromWorkspace(b.Workspace),
			Fields: []adapt.LoadRequestField{
				{
					ID: "uesio/studio.workspace",
				},
				{
					ID: "uesio/studio.app",
				},
				{
					ID: "uesio/studio.bundle",
					Fields: []adapt.LoadRequestField{
						{
							ID: "uesio/studio.app",
							Fields: []adapt.LoadRequestField{
								{
									ID: adapt.UNIQUE_KEY_FIELD,
								},
							},
						},
						{
							ID: "uesio/studio.major",
						},
						{
							ID: "uesio/studio.minor",
						},
						{
							ID: "uesio/studio.patch",
						},
					},
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    "uesio/studio.workspace",
					Value:    b.Workspace.ID,
					Operator: "=",
				},
			},
		},
		sess.GetStudioAnonSession(),
	)
	if err != nil {
		return nil, err
	}
	if len(bdc) != 0 {
		by.Dependencies = map[string]meta.BundleDefDep{}
	}
	for i := range bdc {
		// TODO: Possibly recurse here to get sub dependencies
		bundleName := bdc[i].GetBundleName()
		if bundleName == "" {
			appName := bdc[i].GetAppName()
			return nil, errors.New("Error getting bundle dependency, you don't have " + appName + " app installed")
		}
		by.Dependencies[bdc[i].GetBundleName()] = meta.BundleDefDep{
			Version: bdc[i].GetVersionString(),
		}
	}

	by.PublicProfile = b.Workspace.PublicProfile
	by.HomeRoute = b.Workspace.HomeRoute
	by.LoginRoute = b.Workspace.LoginRoute
	by.DefaultTheme = b.Workspace.DefaultTheme
	by.Favicon = b.Workspace.Favicon

	return &by, nil
}

func (b *WorkspaceBundleStoreConnection) HasAllItems(items []meta.BundleableItem) error {

	return processItems(items, b.Workspace, b.Connection, func(item meta.Item, locators []adapt.ReferenceLocator, id string) error {
		if locators == nil {
			return errors.New("Found an item we weren't expecting")
		}
		if item == nil {
			return fmt.Errorf("Could not find workspace item: " + id)
		}
		return nil
	})

}
