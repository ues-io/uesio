package filebundlestore

import (
	"archive/zip"
	"bytes"
	"errors"
	"fmt"
	"io"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"golang.org/x/sync/errgroup"
)

type FileBundleStoreConnection struct {
	bundlestore.ConnectionOptions
	FileConnection file.Connection
	Cache          *bundle.BundleStoreCache
	PathFunc       func(string, string) string
	ReadOnly       bool
}

func (b *FileBundleStoreConnection) getFilePaths(basePath string, filter meta.FilterFunc, conditions meta.BundleConditions) ([]file.Metadata, error) {

	if b.Cache != nil {
		cachedKeys, ok := b.Cache.GetFileListFromCache(basePath, conditions)
		if ok {
			return cachedKeys, nil
		}
	}

	paths, err := b.FileConnection.List(basePath)
	if err != nil {
		return nil, err
	}

	filteredPaths := []file.Metadata{}

	for _, path := range paths {
		pathString := path.Path()
		if filter(pathString, conditions, true) {
			filteredPaths = append(filteredPaths, path)
		}
	}

	if b.Cache != nil {
		b.Cache.AddFileListToCache(basePath, conditions, filteredPaths)
	}

	return filteredPaths, err
}

func (b *FileBundleStoreConnection) download(w io.Writer, path string) (file.Metadata, error) {
	return b.FileConnection.Download(w, path)
}

func (b *FileBundleStoreConnection) GetItem(item meta.BundleableItem, options *bundlestore.GetItemOptions) error {
	key := item.GetKey()
	fullCollectionName := item.GetCollectionName()
	collectionName := item.GetBundleFolderName()

	// TODO: Need to revisit consistency and approach to differentiating between not having permission and not
	// being found for both authenticated and unauthenticated users.  localstorebundle will return a 404
	// when not found vs. here we're a 403 is returned even for resource that does not actually exist.  Pros/Cons
	// to several different approaches that could be taken but need to be consistent for same/similar operations.
	hasPermission := b.Permissions.HasPermission(item.GetPermChecker())
	if !hasPermission {
		message := fmt.Sprintf("No Permission to metadata item: %s : %s", item.GetCollectionName(), key)
		return exceptions.NewForbiddenException(message)
	}

	if b.Cache != nil {
		if cachedItem, ok := b.Cache.GetItemFromCache(b.Namespace, b.Version, fullCollectionName, key); ok {
			if !b.AllowPrivate && !cachedItem.IsPublic() {
				message := fmt.Sprintf("Metadata item: %s is not public", key)
				return exceptions.NewForbiddenException(message)
			}
			return meta.Copy(item, cachedItem)
		}
	}

	buf := &bytes.Buffer{}
	fileMetadata, err := b.download(buf, filepath.Join(b.PathFunc(b.Namespace, b.Version), collectionName, item.GetPath()))
	if err != nil {
		return fmt.Errorf("unable to download metadata item '%s' of type '%s': %w", key, collectionName, err)
	}
	fakeNamespaceUser := &meta.User{
		BuiltIn: meta.BuiltIn{
			UniqueKey: b.Namespace,
		},
	}

	item.SetModified(*fileMetadata.LastModified())
	item.SetCreated(*fileMetadata.LastModified())

	item.SetModifiedBy(fakeNamespaceUser)
	item.SetCreatedBy(fakeNamespaceUser)
	item.SetOwner(fakeNamespaceUser)

	err = bundlestore.DecodeYAML(item, buf)
	if err != nil {
		return fmt.Errorf("Error decoding metadata item: %s from file: %s : %w", key, fileMetadata.Path(), err)
	}

	if !b.AllowPrivate && !item.IsPublic() {
		return exceptions.NewForbiddenException("Metadata item: " + key + " is not public")
	}
	if b.Cache == nil {
		return nil
	}
	return b.Cache.AddItemToCache(b.Namespace, b.Version, fullCollectionName, key, item)
}

func (b *FileBundleStoreConnection) HasAny(group meta.BundleableGroup, options *bundlestore.HasAnyOptions) (bool, error) {
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

func (b *FileBundleStoreConnection) GetManyItems(items []meta.BundleableItem, options *bundlestore.GetManyItemsOptions) error {
	if options == nil {
		options = &bundlestore.GetManyItemsOptions{}
	}
	for _, item := range items {
		err := b.GetItem(item, nil)
		if err != nil {
			if options.AllowMissingItems && exceptions.IsType[*exceptions.ForbiddenException](err) {
				continue
			}
			return err
		}
	}
	return nil
}

func (b *FileBundleStoreConnection) GetAllItems(group meta.BundleableGroup, options *bundlestore.GetAllItemsOptions) error {
	if options == nil {
		options = &bundlestore.GetAllItemsOptions{}
	}
	// TODO: Think about caching this, but remember conditions
	basePath := filepath.Join(b.PathFunc(b.Namespace, b.Version), group.GetBundleFolderName()) + "/"

	pathInfos, err := b.getFilePaths(basePath, group.FilterPath, options.Conditions)
	if err != nil {
		return err
	}

	for _, pathInfo := range pathInfos {

		retrievedItem := group.GetItemFromPath(pathInfo.Path(), b.Namespace)
		if retrievedItem == nil {
			continue
		}

		// Ignoring forbidden since its a valid situation that a user does not have access
		if err = b.GetItem(retrievedItem, nil); err != nil {
			if exceptions.IsType[*exceptions.ForbiddenException](err) {
				continue
			}
			return err
		}

		// Check to see if the item meets bundle conditions
		// which are not associated with the Item's filesystem path
		if bundlestore.DoesItemMeetBundleConditions(retrievedItem, options.Conditions) {
			group.AddItem(retrievedItem)
		}
	}

	return nil

}

func (b *FileBundleStoreConnection) GetItemAttachment(w io.Writer, item meta.AttachableItem, path string) (file.Metadata, error) {
	return b.download(w, filepath.Join(b.PathFunc(item.GetNamespace(), b.Version), item.GetBundleFolderName(), filepath.Join(item.GetBasePath(), path)))
}

func (b *FileBundleStoreConnection) GetAttachmentPaths(item meta.AttachableItem) ([]file.Metadata, error) {
	// Get all the file paths for this attachable item
	basePath := filepath.Join(b.PathFunc(item.GetNamespace(), b.Version), item.GetBundleFolderName(), item.GetBasePath())

	// Add condition here so that our cache key contains it
	filterConditions := map[string]any{"attachments": "yes"}
	originalFilter := item.GetCollection().(meta.BundleableGroup)
	filter := func(s string, bc meta.BundleConditions, b bool) bool {
		// We want all files that *aren't* the definition file
		return !originalFilter.FilterPath(filepath.Join(item.GetBasePath(), s), nil, true)
	}
	return b.getFilePaths(basePath, filter, filterConditions)
}

func (b *FileBundleStoreConnection) GetItemAttachments(creator bundlestore.FileCreator, item meta.AttachableItem) error {
	// Get all the file paths for this attachable item
	basePath := filepath.Join(b.PathFunc(item.GetNamespace(), b.Version), item.GetBundleFolderName(), item.GetBasePath())

	pathInfos, err := b.GetAttachmentPaths(item)
	if err != nil {
		return err
	}
	for _, pathInfo := range pathInfos {
		path := pathInfo.Path()
		f, err := creator(path)
		if err != nil {
			return err
		}
		_, err = b.FileConnection.Download(f, filepath.Join(basePath, path))
		if err != nil {
			f.Close()
			return err
		}
		f.Close()
	}
	return nil
}

func (b *FileBundleStoreConnection) StoreItem(path string, reader io.Reader) error {

	fullFilePath := filepath.Join(b.Namespace, b.Version, path)

	_, err := b.FileConnection.Upload(reader, fullFilePath)
	if err != nil {
		return errors.New("Error Writing File: " + err.Error())
	}

	return nil
}

func (b *FileBundleStoreConnection) DeleteBundle() error {

	if b.ReadOnly {
		return errors.New("tried to delete bundle in read only bundle store")
	}

	fullFilePath := filepath.Join(b.Namespace, b.Version)

	err := b.FileConnection.EmptyDir(fullFilePath)
	if err != nil {
		return errors.New("Error Deleting Bundle: " + err.Error())
	}

	return nil
}

func (b *FileBundleStoreConnection) GetBundleDef() (*meta.BundleDef, error) {
	var by meta.BundleDef
	buf := &bytes.Buffer{}
	_, err := b.download(buf, filepath.Join(b.PathFunc(b.Namespace, b.Version), "", "bundle.yaml"))
	if err != nil {
		return nil, err
	}

	err = bundlestore.DecodeYAML(&by, buf)
	if err != nil {
		return nil, err
	}
	return &by, nil
}

func (b *FileBundleStoreConnection) HasAllItems(items []meta.BundleableItem) error {
	for _, item := range items {
		err := b.GetItem(item, nil)
		if err != nil {
			return err
		}
	}
	return nil
}

func (b *FileBundleStoreConnection) SetBundleZip(reader io.ReaderAt, size int64) error {

	if b.ReadOnly {
		return errors.New("tried to set bundle zip in read only bundle store")
	}
	// Create a zip reader from the zip file content
	zipReader, err := zip.NewReader(reader, size)
	if err != nil {
		return err
	}

	eg := new(errgroup.Group)
	sem := make(chan struct{}, 10)

	// Iterate over the zip files
	for _, zipFile := range zipReader.File {
		eg.Go(func() error {
			sem <- struct{}{}        // Acquire semaphore
			defer func() { <-sem }() // Release semaphore
			rc, err := zipFile.Open()
			if err != nil {
				return err
			}
			defer rc.Close()
			return b.StoreItem(zipFile.Name, rc)
		})
	}

	return eg.Wait()

}

func (b *FileBundleStoreConnection) GetBundleZip(writer io.Writer, zipoptions *bundlestore.BundleZipOptions) error {

	if b.ReadOnly {
		return errors.New("tried to get bundle zip in read only bundle store")
	}
	session := sess.GetStudioAnonSession(b.Context)

	app := b.Namespace
	version := b.Version

	if app == "" {
		return errors.New("no app provided for retrieve")
	}

	if version == "" {
		return errors.New("no version provided for retrieve")
	}

	major, minor, patch, err := meta.ParseVersionString(version)
	if err != nil {
		return err
	}

	bundleUniqueKey := strings.Join([]string{app, major, minor, patch}, ":")

	var bundle meta.Bundle
	if err := datasource.PlatformLoadOne(
		&bundle,
		&datasource.PlatformLoadOptions{
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/studio.contents",
				},
			},
			Conditions: []wire.LoadRequestCondition{
				{
					Field: commonfields.UniqueKey,
					Value: bundleUniqueKey,
				},
			},
		},
		session,
	); err != nil {
		return err
	}

	// For bundles that don't have a contents file saved, we will need to go get each
	// individual item
	if bundle.Contents == nil {
		zipwriter := zip.NewWriter(writer)
		create := retrieve.NewWriterCreator(zipwriter.Create)
		// Retrieve bundle contents
		err = retrieve.RetrieveBundle(retrieve.BundleDirectory, create, b)
		if err != nil {
			return err
		}

		// Return early, don't go download the file because it does not exist.
		return zipwriter.Close()
	}

	if _, err := filesource.Download(writer, bundle.Contents.ID, session); err != nil {
		return err
	}

	return nil
}
