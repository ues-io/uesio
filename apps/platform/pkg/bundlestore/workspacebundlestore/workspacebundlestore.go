package workspacebundlestore

import (
	"archive/zip"
	"errors"
	"fmt"
	"io"
	"strings"

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

func getParamsFromWorkspace(workspace *meta.Workspace) map[string]any {
	return map[string]any{
		"workspaceid": workspace.ID,
	}
}

func getFilteredFields(fieldNames []string) []wire.LoadRequestField {
	filtered := []string{}
	// Filter out the user field
	for _, v := range fieldNames {
		if v == commonfields.Owner || v == commonfields.CreatedBy || v == commonfields.UpdatedBy || v == "uesio/studio.workspace" {
			continue
		}
		filtered = append(filtered, v)
	}
	return datasource.GetLoadRequestFields(filtered)

}

func (b *WorkspaceBundleStoreConnection) processItems(items []meta.BundleableItem, includeUserFields bool, looper func(meta.BundleableItem, []wire.ReferenceLocator, string) error) error {
	if b.Workspace == nil {
		return errors.New("workspace bundle store, needs a workspace in context")
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

		var fields []wire.LoadRequestField

		if !includeUserFields {
			fields = getFilteredFields(group.GetFields())
		}

		err = datasource.PlatformLoad(&WorkspaceLoadCollection{
			Collection: group,
			Namespace:  namespace,
		}, &datasource.PlatformLoadOptions{
			LoadAll:    true,
			WireName:   "WorkspaceProcessItems",
			Fields:     fields,
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
				return looper(bundleable, nil, dbID)
			}
			// Remove the id from the map, so we can figure out which ones weren't used
			delete(locatorMap, dbID)
			return looper(bundleable, match, dbID)
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
		return nil, errors.New("workspace bundle store, needs a workspace in context")
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

func (b *WorkspaceBundleStoreConnection) GetItem(item meta.BundleableItem, options *bundlestore.GetItemOptions) error {

	if options == nil {
		options = &bundlestore.GetItemOptions{}
	}
	itemUniqueKey := item.GetDBID(b.Workspace.UniqueKey)
	collectionName := item.GetCollectionName()

	// First check the cache
	if bundleStoreCache != nil {
		if cachedItem, ok := bundleStoreCache.GetItemFromCache(b.Namespace, b.getWorkspaceCacheKey(), collectionName, itemUniqueKey); ok {
			return meta.Copy(item, cachedItem)
		}
	}
	var fields []wire.LoadRequestField

	if !options.IncludeUserFields {
		fields = getFilteredFields(item.GetCollection().GetFields())
	}

	// If we didn't find it in cache, we need to go to the database
	if err := datasource.PlatformLoadOne(item, &datasource.PlatformLoadOptions{
		WireName: "WorkspaceGetItem",
		Fields:   fields,
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

	if bundleStoreCache == nil {
		return nil
	}
	return bundleStoreCache.AddItemToCache(b.Namespace, b.getWorkspaceCacheKey(), collectionName, itemUniqueKey, item)
}

func (b *WorkspaceBundleStoreConnection) HasAny(group meta.BundleableGroup, options *bundlestore.HasAnyOptions) (bool, error) {
	if options == nil {
		options = &bundlestore.HasAnyOptions{}
	}
	err := b.GetAllItems(group, &bundlestore.GetAllItemsOptions{
		Conditions: options.Conditions,
	})
	if err != nil {
		return false, err
	}
	return group.Len() > 0, nil
}

func (b *WorkspaceBundleStoreConnection) GetManyItems(items []meta.BundleableItem, options *bundlestore.GetManyItemsOptions) error {
	if options == nil {
		options = &bundlestore.GetManyItemsOptions{}
	}
	return b.processItems(items, options.IncludeUserFields, func(item meta.BundleableItem, locators []wire.ReferenceLocator, id string) error {
		if locators == nil {
			return errors.New("found an item we weren't expecting")
		}
		if item == nil {
			if options.AllowMissingItems {
				return nil
			}
			return fmt.Errorf("could not find workspace item: %s", id)
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

func (b *WorkspaceBundleStoreConnection) GetAllItems(group meta.BundleableGroup, options *bundlestore.GetAllItemsOptions) error {

	if options == nil {
		options = &bundlestore.GetAllItemsOptions{}
	}
	// Add the workspace id as a condition
	loadConditions := make([]wire.LoadRequestCondition, len(options.Conditions))

	i := 0
	for field, value := range options.Conditions {
		// Handle multi-value conditions
		switch typedVal := value.(type) {
		case []any, []string:
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

	var fields []wire.LoadRequestField

	if options.Fields != nil {
		fields = options.Fields
	} else if !options.IncludeUserFields {
		fields = getFilteredFields(group.GetFields())
	}

	return datasource.PlatformLoad(&WorkspaceLoadCollection{
		Collection: group,
		Namespace:  b.Namespace,
	}, &datasource.PlatformLoadOptions{
		WireName:   "WorkspaceGetAllItems",
		Fields:     fields,
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
	err := b.GetItem(item, nil)
	if err != nil {
		return "", err
	}
	recordID, err := item.GetField(commonfields.Id)
	if err != nil {
		return "", err
	}
	recordIDString, ok := recordID.(string)
	if !ok {
		return "", errors.New("invalid record id for attachment")
	}
	return recordIDString, nil
}

func (b *WorkspaceBundleStoreConnection) GetItemAttachment(item meta.AttachableItem, path string) (io.ReadSeekCloser, file.Metadata, error) {
	recordIDString, err := b.GetItemRecordID(item)
	if err != nil {
		return nil, nil, errors.New("invalid record id for attachment")
	}
	r, userFileMetadata, err := filesource.DownloadAttachment(recordIDString, path, b.getStudioAnonSession())
	if err != nil {
		return nil, nil, err
	}
	return r, userFileMetadata, nil
}

func (b *WorkspaceBundleStoreConnection) GetAttachmentData(item meta.AttachableItem) (*meta.UserFileMetadataCollection, error) {
	recordIDString, err := b.GetItemRecordID(item)
	if err != nil {
		return nil, fmt.Errorf("invalid record id for attachment: %w", err)
	}
	userFiles := &meta.UserFileMetadataCollection{}
	err = datasource.PlatformLoad(
		userFiles,
		&datasource.PlatformLoadOptions{
			WireName: "WorkspaceGetItemAttachments",
			Params:   getParamsFromWorkspace(b.Workspace),
			Conditions: []wire.LoadRequestCondition{
				{
					Field: "uesio/core.recordid",
					Value: recordIDString,
				},
			},
			Connection: b.Connection,
		},
		b.getStudioAnonSession(),
	)
	return userFiles, nil
}

func (b *WorkspaceBundleStoreConnection) GetAttachmentPaths(item meta.AttachableItem) ([]file.Metadata, error) {
	userFiles, err := b.GetAttachmentData(item)
	if err != nil {
		return nil, err
	}
	paths := make([]file.Metadata, userFiles.Len())
	for i, ufm := range *userFiles {
		paths[i] = ufm
	}
	return paths, nil
}

func (b *WorkspaceBundleStoreConnection) GetItemAttachments(creator bundlestore.FileCreator, item meta.AttachableItem) error {
	userFiles, err := b.GetAttachmentData(item)
	if err != nil {
		return err
	}

	for _, ufm := range *userFiles {
		err := func() error {
			f, err := creator(ufm.Path())
			if err != nil {
				return err
			}
			defer f.Close()

			r, _, err := filesource.DownloadItem(ufm, b.getStudioAnonSession())
			if err != nil {
				return err
			}
			defer r.Close()

			_, err = io.Copy(f, r)
			if err != nil {
				return err
			}
			return nil
		}()
		if err != nil {
			return err
		}
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
			WireName:   "WorkspaceGetBundleDef",
			Params:     getParamsFromWorkspace(b.Workspace),
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/studio.bundle",
					Fields: []wire.LoadRequestField{
						{
							ID: commonfields.UniqueKey,
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
	for _, bd := range bdc {
		if bd.Bundle == nil {
			return nil, fmt.Errorf("error getting bundle dependency: %s", bd.UniqueKey)
		}
		key := bd.Bundle.UniqueKey
		bundleName, _, _ := strings.Cut(key, ":")
		by.Dependencies[bundleName] = meta.BundleDefDep{
			Version: bd.GetVersionString(),
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
	return b.processItems(items, false, func(item meta.BundleableItem, locators []wire.ReferenceLocator, id string) error {
		if locators == nil {
			return errors.New("found an item we weren't expecting")
		}
		if item == nil {
			return fmt.Errorf("could not find workspace item: %s", id)
		}
		return nil
	})
}

func (b *WorkspaceBundleStoreConnection) SetBundleZip(reader io.ReaderAt, size int64) error {
	return errors.New("tried to upload bundle zip in workspace bundle store")
}

func (b *WorkspaceBundleStoreConnection) GetBundleZip(writer io.Writer, zipoptions *bundlestore.BundleZipOptions) error {
	if b.Workspace == nil {
		return errors.New("no workspace provided for retrieve")
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
