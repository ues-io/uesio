package workspacebundlestore

import (
	"archive/zip"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type wsFileMeta struct {
	userFileMeta *meta.UserFileMetadata
}

func newWorkspaceFileMeta(info *meta.UserFileMetadata) file.Metadata {
	return &wsFileMeta{info}
}

func (fm *wsFileMeta) ContentLength() int64 {
	return fm.userFileMeta.ContentLength
}

func (fm *wsFileMeta) LastModified() *time.Time {
	t := time.Unix(fm.userFileMeta.UpdatedAt, 0)
	return &t
}

func getParamsFromWorkspace(workspace *meta.Workspace) map[string]interface{} {
	return map[string]interface{}{
		"workspaceid": workspace.ID,
	}
}

func (b *WorkspaceBundleStoreConnection) processItems(items []meta.BundleableItem, looper func(meta.Item, []wire.ReferenceLocator, string) error) error {
	if b.Workspace == nil {
		return errors.New("Workspace bundle store, needs a workspace in context")
	}
	collectionLocatorMap := map[string]wire.LocatorMap{}
	namespace := b.Workspace.GetAppFullName()

	for _, item := range items {
		collectionName := item.GetBundleFolderName()
		dbID := item.GetDBID(b.Workspace.UniqueKey)
		_, ok := collectionLocatorMap[collectionName]
		if !ok {
			collectionLocatorMap[collectionName] = wire.LocatorMap{}
		}
		locatorMap := collectionLocatorMap[collectionName]
		locatorMap.AddID(dbID, wire.ReferenceLocator{
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
			Connection: b.Connection,
			Params:     getParamsFromWorkspace(b.Workspace),
			Conditions: []wire.LoadRequestCondition{
				{
					Field:    commonfields.UniqueKey,
					Value:    locatorMap.GetIDs(),
					Operator: "IN",
				},
			}}, b.getStudioAnonSession())
		if err != nil {
			return err
		}

		err = group.Loop(func(item meta.Item, _ string) error {
			bundleable := item.(meta.BundleableItem)
			dbID := bundleable.GetDBID(b.Workspace.UniqueKey)
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
	studioAnonSession *sess.Session
}

func (b *WorkspaceBundleStoreConnection) getStudioAnonSession() *sess.Session {
	if b.studioAnonSession == nil {
		b.studioAnonSession = sess.GetStudioAnonSession(b.Context)
	}
	return b.studioAnonSession
}

// use the workspace's ID, not Name, as the cache key, to ensure that if workspaces are truncated / deleted
// and then recreated, we don't use still use old workspace metadata caches
func (b *WorkspaceBundleStoreConnection) getWorkspaceCacheKey() string {
	return b.Workspace.ID
}

func (b *WorkspaceBundleStoreConnection) GetItem(item meta.BundleableItem) error {

	itemUniqueKey := item.GetDBID(b.Workspace.UniqueKey)
	collectionName := item.GetCollectionName()

	// First check the cache
	if doCache {
		if cachedItem, ok := bundleStoreCache.GetItemFromCache(b.Namespace, b.getWorkspaceCacheKey(), collectionName, itemUniqueKey); ok {
			return meta.Copy(item, cachedItem)
		}
	}

	// If we didn't find it in cache, we need to go to the database
	if err := datasource.PlatformLoadOne(item, &datasource.PlatformLoadOptions{
		Conditions: []wire.LoadRequestCondition{
			{
				Field: commonfields.UniqueKey,
				Value: itemUniqueKey,
			},
		},
		Params:     getParamsFromWorkspace(b.Workspace),
		Connection: b.Connection,
	}, b.getStudioAnonSession()); err != nil {
		return err
	}

	item.SetNamespace(b.Namespace)

	if !doCache {
		return nil
	}
	return bundleStoreCache.AddItemToCache(b.Namespace, b.getWorkspaceCacheKey(), collectionName, itemUniqueKey, item)
}

func (b *WorkspaceBundleStoreConnection) HasAny(group meta.BundleableGroup, conditions meta.BundleConditions) (bool, error) {
	err := b.GetAllItems(group, conditions)
	if err != nil {
		return false, err
	}
	return group.Len() > 0, nil
}

func (b *WorkspaceBundleStoreConnection) GetManyItems(items []meta.BundleableItem) error {
	return b.processItems(items, func(item meta.Item, locators []wire.ReferenceLocator, id string) error {
		if locators == nil {
			return errors.New("Found an item we weren't expecting")
		}
		if item == nil {
			return fmt.Errorf("Could not find workspace item: " + id)
		}
		for _, locator := range locators {
			err := meta.Copy(locator.Item, item)
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func (b *WorkspaceBundleStoreConnection) GetAllItems(group meta.BundleableGroup, conditions meta.BundleConditions) error {

	// Add the workspace id as a condition
	loadConditions := make([]wire.LoadRequestCondition, len(conditions))

	i := 0
	for field, value := range conditions {
		// Handle multi-value conditions
		switch typedVal := value.(type) {
		case []interface{}, []string:
			loadConditions[i] = wire.LoadRequestCondition{
				Field:       field,
				Values:      typedVal,
				Operator:    "IN",
				ValueSource: "VALUE",
			}
		default:
			loadConditions[i] = wire.LoadRequestCondition{
				Field: field,
				Value: value,
			}
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
		Orders: []wire.LoadRequestOrder{{
			Field: commonfields.UniqueKey,
		}},
	}, b.getStudioAnonSession())

}

func (b *WorkspaceBundleStoreConnection) GetItemRecordID(item meta.AttachableItem) (string, error) {
	err := b.GetItem(item)
	if err != nil {
		return "", err
	}
	recordID, err := item.GetField(commonfields.Id)
	if err != nil {
		return "", err
	}
	recordIDString, ok := recordID.(string)
	if !ok {
		return "", errors.New("Invalid Record ID for attachment")
	}
	return recordIDString, nil
}

func (b *WorkspaceBundleStoreConnection) GetItemAttachment(w io.Writer, item meta.AttachableItem, path string) (file.Metadata, error) {
	recordIDString, err := b.GetItemRecordID(item)
	if err != nil {
		return nil, errors.New("invalid record id for attachment")
	}
	userFileMetadata, err := filesource.DownloadAttachment(w, recordIDString, path, b.getStudioAnonSession())
	if err != nil {
		return nil, err
	}
	return newWorkspaceFileMeta(userFileMetadata), nil
}

func (b *WorkspaceBundleStoreConnection) GetItemAttachments(creator bundlestore.FileCreator, item meta.AttachableItem) error {
	recordIDString, err := b.GetItemRecordID(item)
	if err != nil {
		return errors.New("Invalid Record ID for attachment: " + err.Error())
	}
	userFiles := &meta.UserFileMetadataCollection{}
	err = datasource.PlatformLoad(
		userFiles,
		&datasource.PlatformLoadOptions{
			Params: getParamsFromWorkspace(b.Workspace),
			Conditions: []wire.LoadRequestCondition{
				{
					Field: "uesio/core.recordid",
					Value: recordIDString,
				},
			},
		},
		b.getStudioAnonSession(),
	)
	if err != nil {
		return err
	}

	for _, ufm := range *userFiles {
		f, err := creator(ufm.Path)
		if err != nil {
			return err
		}
		_, err = filesource.DownloadItem(f, ufm, b.getStudioAnonSession())
		if err != nil {
			f.Close()
			return err
		}
		f.Close()
	}
	return nil
}

func (b *WorkspaceBundleStoreConnection) DeleteBundle() error {
	return errors.New("tried to delete bundle in the workspace bundle store")
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
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/studio.workspace",
				},
				{
					ID: "uesio/studio.app",
				},
				{
					ID: "uesio/studio.bundle",
					Fields: []wire.LoadRequestField{
						{
							ID: "uesio/studio.app",
							Fields: []wire.LoadRequestField{
								{
									ID: commonfields.UniqueKey,
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
			Conditions: []wire.LoadRequestCondition{
				{
					Field:    "uesio/studio.workspace",
					Value:    b.Workspace.ID,
					Operator: "=",
				},
			},
		},
		b.getStudioAnonSession(),
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
	by.SignupRoute = b.Workspace.SignupRoute
	by.DefaultTheme = b.Workspace.DefaultTheme
	by.Favicon = b.Workspace.Favicon

	return &by, nil
}

func (b *WorkspaceBundleStoreConnection) HasAllItems(items []meta.BundleableItem) error {
	return b.processItems(items, func(item meta.Item, locators []wire.ReferenceLocator, id string) error {
		if locators == nil {
			return errors.New("Found an item we weren't expecting")
		}
		if item == nil {
			return fmt.Errorf("Could not find workspace item: " + id)
		}
		return nil
	})
}

func (b *WorkspaceBundleStoreConnection) SetBundleZip(reader io.ReaderAt, size int64) error {
	return errors.New("tried to upload bundle zip in Workspace Bundle Store")
}

func (b *WorkspaceBundleStoreConnection) GetBundleZip(writer io.Writer, zipoptions *bundlestore.BundleZipOptions) error {
	if b.Workspace == nil {
		return errors.New("no Workspace provided for retrieve")
	}
	// Create a new zip archive.
	zipwriter := zip.NewWriter(writer)
	defer zipwriter.Close()
	create := retrieve.NewWriterCreator(zipwriter.Create)
	// Retrieve bundle contents
	if err := retrieve.RetrieveBundle(retrieve.BundleDirectory, create, b); err != nil {
		return err
	}
	if zipoptions != nil && zipoptions.IncludeGeneratedTypes {
		// Retrieve generated TypeScript files
		if err := retrieve.RetrieveGeneratedFiles(retrieve.GeneratedDir, create, b); err != nil {
			return err
		}
	}
	return nil
}
