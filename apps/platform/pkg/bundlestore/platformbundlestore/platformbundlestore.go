package platformbundlestore

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/systembundlestore"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/file"
)

type PlatformBundleStore struct{}

func (b *PlatformBundleStore) GetConnection(options bundlestore.ConnectionOptions) (bundlestore.BundleStoreConnection, error) {
	return &PlatformBundleStoreConnection{
		ConnectionOptions: options,
	}, nil
}

type PlatformBundleStoreConnection struct {
	bundlestore.ConnectionOptions
}

func getPlatformFileConnection() (file.Connection, error) {
	return fileadapt.GetFileConnection("uesio/core.bundlestore", sess.GetStudioAnonSession())
}

func getBasePath(namespace, version string) string {
	return filepath.Join(namespace, version, "bundle")
}

func download(w io.Writer, path string) (file.Metadata, error) {
	conn, err := getPlatformFileConnection()
	if err != nil {
		return nil, err
	}

	return conn.Download(w, path)
}

func (b *PlatformBundleStoreConnection) GetItem(item meta.BundleableItem) error {
	key := item.GetKey()
	fullCollectionName := item.GetCollectionName()
	collectionName := item.GetBundleFolderName()

	hasPermission := b.Permissions.HasPermission(item.GetPermChecker())
	if !hasPermission {
		message := fmt.Sprintf("No Permission to metadata item: %s : %s", item.GetCollectionName(), key)
		return bundlestore.NewPermissionError(message)
	}

	cachedItem, ok := bundle.GetItemFromCache(b.Namespace, b.Version, fullCollectionName, key)

	if ok {
		if !b.AllowPrivate && !cachedItem.IsPublic() {
			return bundlestore.NewPermissionError("Metadata item: " + key + " is not public")
		}
		meta.Copy(item, cachedItem)
		return nil
	}
	buf := &bytes.Buffer{}
	fileMetadata, err := download(buf, filepath.Join(getBasePath(b.Namespace, b.Version), collectionName, item.GetPath()))
	if err != nil {
		return bundlestore.NewNotFoundError("Metadata item: " + key + " does not exist")
	}
	item.SetModified(*fileMetadata.LastModified())
	err = bundlestore.DecodeYAML(item, buf)
	if err != nil {
		return err
	}
	if !b.AllowPrivate && !item.IsPublic() {
		return bundlestore.NewPermissionError("Metadata item: " + key + " is not public")
	}
	bundle.AddItemToCache(item, b.Namespace, b.Version)
	return nil
}

func (b *PlatformBundleStoreConnection) HasAny(group meta.BundleableGroup, conditions meta.BundleConditions) (bool, error) {
	err := b.GetAllItems(group, conditions)
	if err != nil {
		return false, err
	}
	return group.Len() > 0, nil
}

func (b *PlatformBundleStoreConnection) GetManyItems(items []meta.BundleableItem) error {
	for _, item := range items {
		err := b.GetItem(item)
		if err != nil {
			return err
		}
	}
	return nil
}

func (b *PlatformBundleStoreConnection) GetAllItems(group meta.BundleableGroup, conditions meta.BundleConditions) error {
	// TODO: Think about caching this, but remember conditions
	basePath := filepath.Join(getBasePath(b.Namespace, b.Version), group.GetBundleFolderName()) + "/"

	conn, err := getPlatformFileConnection()
	if err != nil {
		return err
	}
	paths, err := systembundlestore.GetFilePaths(basePath, group.FilterPath, conditions, conn)
	if err != nil {
		return err
	}

	for _, path := range paths {

		retrievedItem := group.GetItemFromPath(path, b.Namespace)
		if retrievedItem == nil {
			continue
		}

		err = b.GetItem(retrievedItem)

		if err != nil {
			if _, ok := err.(*bundlestore.PermissionError); ok {
				continue
			}
			if _, ok := err.(*bundlestore.NotFoundError); ok {
				continue
			}
			return err
		}

		// Check to see if the item meets bundle conditions
		// which are not associated with the Item's filesystem path
		if bundlestore.DoesItemMeetBundleConditions(retrievedItem, conditions) {
			group.AddItem(retrievedItem)
		}
	}

	return nil

}

func (b *PlatformBundleStoreConnection) GetItemAttachment(w io.Writer, item meta.AttachableItem, path string) (file.Metadata, error) {
	return download(w, filepath.Join(getBasePath(item.GetNamespace(), b.Version), item.GetBundleFolderName(), filepath.Join(item.GetBasePath(), path)))
}

func (b *PlatformBundleStoreConnection) GetItemAttachments(item meta.AttachableItem, creator bundlestore.FileCreator) error {
	// Get all of the file paths for this attachable item
	basePath := filepath.Join(getBasePath(item.GetNamespace(), b.Version), item.GetBundleFolderName(), item.GetBasePath())
	conn, err := getPlatformFileConnection()
	if err != nil {
		return err
	}
	// Add condition here so that our cache key containts it
	filterConditions := map[string]string{"attachments": "yes"}
	originalFilter := item.GetCollection().(meta.BundleableGroup)
	filter := func(s string, bc meta.BundleConditions, b bool) bool {
		// We want all files that *aren't* the definition file
		return !originalFilter.FilterPath(filepath.Join(item.GetBasePath(), s), nil, true)
	}
	paths, err := systembundlestore.GetFilePaths(basePath, filter, filterConditions, conn)
	if err != nil {
		return err
	}
	for _, path := range paths {
		f, err := creator(path)
		if err != nil {
			return err
		}
		_, err = conn.Download(f, filepath.Join(basePath, path))
		if err != nil {
			f.Close()
			return err
		}
		f.Close()
	}
	return nil
}

func (b *PlatformBundleStoreConnection) StoreItem(path string, reader io.Reader) error {

	fullFilePath := filepath.Join(getBasePath(b.Namespace, b.Version), path)

	conn, err := getPlatformFileConnection()
	if err != nil {
		return err
	}

	err = conn.Upload(reader, fullFilePath)
	if err != nil {
		return errors.New("Error Writing File: " + err.Error())
	}

	return nil
}

func (b *PlatformBundleStoreConnection) DeleteBundle() error {

	fullFilePath := filepath.Join(b.Namespace, b.Version)

	conn, err := getPlatformFileConnection()
	if err != nil {
		return err
	}

	err = conn.EmptyDir(fullFilePath)
	if err != nil {
		return errors.New("Error Deleting Bundle: " + err.Error())
	}

	return nil
}

func (b *PlatformBundleStoreConnection) GetBundleDef() (*meta.BundleDef, error) {
	var by meta.BundleDef
	buf := &bytes.Buffer{}
	_, err := download(buf, filepath.Join(getBasePath(b.Namespace, b.Version), "", "bundle.yaml"))
	if err != nil {
		return nil, err
	}

	err = bundlestore.DecodeYAML(&by, buf)
	if err != nil {
		return nil, err
	}
	return &by, nil
}

func (b *PlatformBundleStoreConnection) HasAllItems(items []meta.BundleableItem) error {
	for _, item := range items {
		err := b.GetItem(item)
		if err != nil {
			return err
		}
	}
	return nil
}
