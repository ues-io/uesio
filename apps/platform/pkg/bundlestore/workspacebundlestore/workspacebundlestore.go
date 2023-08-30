package workspacebundlestore

import (
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/licensing"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getParamsFromWorkspace(workspace *meta.Workspace) map[string]string {
	return map[string]string{
		"workspaceid": workspace.ID,
	}
}

func processItems(items []meta.BundleableItem, session *sess.Session, connection adapt.Connection, looper func(meta.Item, []adapt.ReferenceLocator, string) error) error {
	workspace := session.GetWorkspace()
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
			}}, session.RemoveWorkspaceContext())
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

type WorkspaceBundleStore struct {
}

func (b *WorkspaceBundleStore) GetItem(item meta.BundleableItem, version string, session *sess.Session, connection adapt.Connection) error {

	workspace := session.GetWorkspace()
	if workspace == nil {
		return errors.New("Workspace bundle store, needs a workspace in context")
	}

	item.SetNamespace(workspace.GetAppFullName())

	return datasource.PlatformLoadOne(item, &datasource.PlatformLoadOptions{
		Conditions: []adapt.LoadRequestCondition{
			{
				Field: adapt.UNIQUE_KEY_FIELD,
				Value: item.GetDBID(workspace.UniqueKey),
			},
		},
		Params:     getParamsFromWorkspace(workspace),
		Connection: connection,
	}, session.RemoveWorkspaceContext())
}

func (b *WorkspaceBundleStore) HasAny(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session, connection adapt.Connection) (bool, error) {
	err := b.GetAllItems(group, namespace, version, conditions, session, connection)
	if err != nil {
		return false, err
	}
	return group.Len() > 0, nil
}

func (b *WorkspaceBundleStore) GetManyItems(items []meta.BundleableItem, version string, session *sess.Session, connection adapt.Connection) error {
	return processItems(items, session, connection, func(item meta.Item, locators []adapt.ReferenceLocator, id string) error {
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

func (b *WorkspaceBundleStore) GetAllItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session, connection adapt.Connection) error {

	workspace := session.GetWorkspace()
	if workspace == nil {
		return errors.New("Workspace bundle store, needs a workspace in context")
	}

	// Add the workspace id as a condition
	loadConditions := []adapt.LoadRequestCondition{}

	for field, value := range conditions {
		loadConditions = append(loadConditions, adapt.LoadRequestCondition{
			Field: field,
			Value: value,
		})
	}

	return datasource.PlatformLoad(&WorkspaceLoadCollection{
		Collection: group,
		Namespace:  namespace,
	}, &datasource.PlatformLoadOptions{
		Conditions: loadConditions,
		Params:     getParamsFromWorkspace(workspace),
		Connection: connection,
		LoadAll:    true,
		Orders: []adapt.LoadRequestOrder{{
			Field: adapt.UNIQUE_KEY_FIELD,
		}},
	}, session.RemoveWorkspaceContext())

}

func (b *WorkspaceBundleStore) GetItemAttachment(item meta.AttachableItem, version string, path string, session *sess.Session) (time.Time, io.ReadSeeker, error) {
	modTime := time.Time{}
	err := b.GetItem(item, version, session, nil)
	if err != nil {
		return modTime, nil, err
	}
	recordID, err := item.GetField(adapt.ID_FIELD)
	if err != nil {
		return modTime, nil, err
	}
	stream, _, err := filesource.DownloadAttachment(recordID.(string), path, session.RemoveWorkspaceContext())
	if err != nil {
		return modTime, nil, err
	}
	return modTime, stream, nil
}

func (b *WorkspaceBundleStore) GetAttachmentPaths(item meta.AttachableItem, version string, session *sess.Session) ([]string, error) {
	workspace := session.GetWorkspace()
	if workspace == nil {
		return nil, errors.New("Workspace bundle store, needs a workspace in context")
	}
	err := b.GetItem(item, version, session, nil)
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
			Params: getParamsFromWorkspace(workspace),
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/core.recordid",
					Value: recordID,
				},
			},
		},
		session.RemoveWorkspaceContext(),
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

func (b *WorkspaceBundleStore) StoreItem(namespace, version, path string, reader io.Reader, session *sess.Session) error {
	return errors.New("Tried to store items in the workspace bundle store")
}

func (b *WorkspaceBundleStore) DeleteBundle(namespace, version string, session *sess.Session) error {
	return errors.New("Tried to delete bundle in the workspace bundle store")
}

func (b *WorkspaceBundleStore) GetBundleDef(namespace, version string, session *sess.Session, connection adapt.Connection) (*meta.BundleDef, error) {
	workspace := session.GetWorkspace()
	if workspace == nil {
		return nil, errors.New("Workspace bundle store, needs a workspace in context")
	}

	var by meta.BundleDef
	by.Name = namespace
	bdc := meta.BundleDependencyCollection{}
	err := datasource.PlatformLoad(
		&bdc,
		&datasource.PlatformLoadOptions{
			Connection: connection,
			Params:     getParamsFromWorkspace(workspace),
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
					Value:    workspace.ID,
					Operator: "=",
				},
			},
		},
		session.RemoveWorkspaceContext(),
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

	by.PublicProfile = workspace.PublicProfile
	by.HomeRoute = workspace.HomeRoute
	by.LoginRoute = workspace.LoginRoute
	by.DefaultTheme = workspace.DefaultTheme
	by.Favicon = workspace.Favicon

	licenseMap, err := licensing.GetLicenses(namespace, connection)
	if err != nil {
		return nil, err
	}
	by.Licenses = licenseMap

	return &by, nil
}

func (b *WorkspaceBundleStore) HasAllItems(items []meta.BundleableItem, version string, session *sess.Session, connection adapt.Connection) error {

	return processItems(items, session, connection, func(item meta.Item, locators []adapt.ReferenceLocator, id string) error {
		if locators == nil {
			return errors.New("Found an item we weren't expecting")
		}
		if item == nil {
			return fmt.Errorf("Could not find workspace item: " + id)
		}
		return nil
	})

}
