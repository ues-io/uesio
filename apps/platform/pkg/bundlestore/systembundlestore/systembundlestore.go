package systembundlestore

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/fileadapt/localfiles"
	"github.com/thecloudmasters/uesio/pkg/meta"
	filetypes "github.com/thecloudmasters/uesio/pkg/types/file"
)

type SystemBundleStore struct{}

func (b *SystemBundleStore) GetConnection(options bundlestore.ConnectionOptions) (bundlestore.BundleStoreConnection, error) {
	return &SystemBundleStoreConnection{
		ConnectionOptions: options,
	}, nil
}

type SystemBundleStoreConnection struct {
	bundlestore.ConnectionOptions
}

func getBasePath(namespace, version string) string {
	// We're ignoring the version here because we always get the latest
	return filepath.Join("..", "..", "libs", "apps", namespace, "bundle")
}

func getFile(namespace string, version string, objectname string, filename string) (*os.File, error) {
	filePath := filepath.Join(getBasePath(namespace, version), objectname, filename)
	return os.Open(filePath)
}

func GetFilePaths(basePath string, group meta.BundleableGroup, conditions meta.BundleConditions, conn filetypes.Connection) ([]string, error) {

	cachedKeys, ok := bundle.GetFileListFromCache(basePath, conditions)
	if ok {
		return cachedKeys, nil
	}

	paths, err := conn.List(basePath)
	if err != nil {
		return nil, err
	}

	filteredPaths := []string{}

	for _, path := range paths {
		if group.FilterPath(path, conditions, true) {
			filteredPaths = append(filteredPaths, path)
		}
	}

	bundle.AddFileListToCache(basePath, conditions, filteredPaths)
	return filteredPaths, err
}

func (b *SystemBundleStoreConnection) GetItem(item meta.BundleableItem) error {
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
			message := fmt.Sprintf("Metadata item: %s is not public", key)
			return bundlestore.NewPermissionError(message)
		}
		meta.Copy(item, cachedItem)
		return nil
	}

	file, err := getFile(b.Namespace, b.Version, collectionName, item.GetPath())
	if err != nil {
		return err
	}

	fileInfo, err := file.Stat()
	if err != nil {
		return err
	}

	item.SetModified(fileInfo.ModTime())

	defer file.Close()
	err = bundlestore.DecodeYAML(item, file)
	if err != nil {
		return err
	}
	if !b.AllowPrivate && !item.IsPublic() {
		message := fmt.Sprintf("Metadata item: %s is not public", key)
		return bundlestore.NewPermissionError(message)
	}
	bundle.AddItemToCache(item, b.Namespace, b.Version)
	return nil

}

func (b *SystemBundleStoreConnection) HasAny(group meta.BundleableGroup, conditions meta.BundleConditions) (bool, error) {
	err := b.GetAllItems(group, conditions)
	if err != nil {
		return false, err
	}
	return group.Len() > 0, nil
}

func (b *SystemBundleStoreConnection) GetManyItems(items []meta.BundleableItem) error {
	for _, item := range items {
		err := b.GetItem(item)
		if err != nil {
			return err
		}
	}
	return nil
}

func (b *SystemBundleStoreConnection) doesItemMeetBundleConditions(item meta.BundleableItem, conditions meta.BundleConditions) bool {
	if len(conditions) == 0 {
		return true
	}
	for field, conditionDef := range conditions {
		fieldValue, err := item.GetField(field)
		// If any condition fails, bail early
		if err != nil {
			return false
		}
		if fieldValue != conditionDef {
			return false
		}
	}
	return true
}

func (b *SystemBundleStoreConnection) GetAllItems(group meta.BundleableGroup, conditions meta.BundleConditions) error {

	// TODO: Think about caching this, but remember conditions
	basePath := filepath.Join(getBasePath(b.Namespace, b.Version), group.GetBundleFolderName()) + string(os.PathSeparator)

	conn := localfiles.Connection{}
	paths, err := GetFilePaths(basePath, group, conditions, &conn)
	if err != nil {
		return err
	}

	for _, path := range paths {

		retrievedItem := group.GetItemFromPath(path, b.Namespace)
		if retrievedItem == nil {
			continue
		}

		err = b.GetItem(retrievedItem)

		// Check to see if the item meets bundle conditions
		// which are not associated with the Item's filesystem path
		if !b.doesItemMeetBundleConditions(retrievedItem, conditions) {
			continue
		}

		if err != nil {
			if _, ok := err.(*bundlestore.PermissionError); ok {
				continue
			}
			return err
		}
		group.AddItem(retrievedItem)
	}

	return nil
}

func (b *SystemBundleStoreConnection) GetItemAttachment(item meta.AttachableItem, path string) (filetypes.Metadata, io.ReadSeeker, error) {
	osFile, err := getFile(item.GetNamespace(), b.Version, item.GetBundleFolderName(), filepath.Join(item.GetBasePath(), path))
	if err != nil {
		return nil, nil, err
	}
	fileInfo, err := osFile.Stat()
	if err != nil {
		return nil, nil, err
	}
	return filetypes.NewLocalFileMeta(fileInfo), osFile, nil
}

func (b *SystemBundleStoreConnection) GetAttachmentPaths(item meta.AttachableItem) ([]string, error) {
	return nil, nil
}

func (b *SystemBundleStoreConnection) StoreItem(path string, reader io.Reader) error {
	return errors.New("Cannot Write to System Bundle Store")
}

func (b *SystemBundleStoreConnection) DeleteBundle() error {
	return errors.New("Tried to delete bundle in System Bundle Store")
}

func (b *SystemBundleStoreConnection) GetBundleDef() (*meta.BundleDef, error) {
	var by meta.BundleDef
	file, err := getFile(b.Namespace, b.Version, "", "bundle.yaml")
	if err != nil {
		return nil, err
	}
	defer file.Close()

	err = bundlestore.DecodeYAML(&by, file)
	if err != nil {
		return nil, err
	}
	return &by, nil
}

func (b *SystemBundleStoreConnection) HasAllItems(items []meta.BundleableItem) error {
	for _, item := range items {
		err := b.GetItem(item)
		if err != nil {
			return err
		}
	}
	return nil
}
