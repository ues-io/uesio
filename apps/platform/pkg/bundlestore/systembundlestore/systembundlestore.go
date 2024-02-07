package systembundlestore

import (
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"time"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/fileadapt/localfiles"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	filetypes "github.com/thecloudmasters/uesio/pkg/types/file"
)

var doCache bool

// Bundle entries should be very long-lived, so we will allow them to live in memory for a relatively long time,
// and only expire them infrequently because the cost of doing a filesystem read is quite high.
// TODO: Consider pre-loading common bundles into the cache on init, to prevent initial requests from being slow.
var bundleStoreCache *bundle.BundleStoreCache

func init() {
	// system bundle store cache - on by default
	doCache = os.Getenv("UESIO_CACHE_SITE_BUNDLES") != "false"
	if doCache {
		bundleStoreCache = bundle.NewBundleStoreCache(15*time.Minute, 15*time.Minute)
	}
}

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
	return path.Join("..", "..", "libs", "apps", namespace, "bundle")
}

func getFile(namespace string, version string, objectname string, filename string) (*os.File, error) {
	filePath := filepath.Join(getBasePath(namespace, version), objectname, filename)
	return os.Open(filePath)
}

func GetFilePaths(basePath string, filter meta.FilterFunc, conditions meta.BundleConditions, conn filetypes.Connection) ([]string, error) {

	if doCache {
		cachedKeys, ok := bundleStoreCache.GetFileListFromCache(basePath, conditions)
		if ok {
			return cachedKeys, nil
		}
	}

	paths, err := conn.List(basePath)
	if err != nil {
		return nil, err
	}

	filteredPaths := []string{}

	for _, path := range paths {
		if filter(path, conditions, true) {
			filteredPaths = append(filteredPaths, path)
		}
	}

	if doCache {
		bundleStoreCache.AddFileListToCache(basePath, conditions, filteredPaths)
	}

	return filteredPaths, err
}

func (b *SystemBundleStoreConnection) GetItem(item meta.BundleableItem) error {
	key := item.GetKey()
	fullCollectionName := item.GetCollectionName()
	collectionName := item.GetBundleFolderName()

	hasPermission := b.Permissions.HasPermission(item.GetPermChecker())
	if !hasPermission {
		message := fmt.Sprintf("No Permission to metadata item: %s : %s", item.GetCollectionName(), key)
		return exceptions.NewForbiddenException(message)
	}

	if doCache {
		if cachedItem, ok := bundleStoreCache.GetItemFromCache(b.Namespace, b.Version, fullCollectionName, key); ok {
			if !b.AllowPrivate && !cachedItem.IsPublic() {
				message := fmt.Sprintf("Metadata item: %s is not public", key)
				return exceptions.NewForbiddenException(message)
			}
			return meta.Copy(item, cachedItem)
		}
	}

	file, err := getFile(b.Namespace, b.Version, collectionName, item.GetPath())
	if err != nil {
		if _, isPathErr := err.(*fs.PathError); isPathErr {
			return exceptions.NewNotFoundException("could not find item " + key + " in collection " + fullCollectionName)
		}
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
		return exceptions.NewForbiddenException(message)
	}
	if !doCache {
		return nil
	}
	return bundleStoreCache.AddItemToCache(b.Namespace, b.Version, item.GetCollectionName(), item.GetKey(), item)

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
			switch err.(type) {
			case *exceptions.ForbiddenException:
				continue
			}
			return err
		}
	}
	return nil
}

func (b *SystemBundleStoreConnection) GetAllItems(group meta.BundleableGroup, conditions meta.BundleConditions) error {

	// TODO: Think about caching this, but remember conditions
	basePath := path.Join(getBasePath(b.Namespace, b.Version), group.GetBundleFolderName()) + "/"

	conn := localfiles.Connection{}
	paths, err := GetFilePaths(basePath, group.FilterPath, conditions, &conn)
	if err != nil {
		return err
	}

	for _, path := range paths {

		retrievedItem := group.GetItemFromPath(path, b.Namespace)
		if retrievedItem == nil {
			continue
		}

		// TODO: Shouldn't we return these errors?
		if err = b.GetItem(retrievedItem); err != nil {
			switch err.(type) {
			case *exceptions.NotFoundException, *exceptions.ForbiddenException:
				continue
			default:
				return err
			}
		}

		// Check to see if the item meets bundle conditions
		// which are not associated with the Item's filesystem path
		if bundlestore.DoesItemMeetBundleConditions(retrievedItem, conditions) {
			group.AddItem(retrievedItem)
		}
	}

	return nil
}

func (b *SystemBundleStoreConnection) GetItemAttachment(w io.Writer, item meta.AttachableItem, itempath string) (filetypes.Metadata, error) {
	osFile, err := getFile(item.GetNamespace(), b.Version, item.GetBundleFolderName(), path.Join(item.GetBasePath(), itempath))
	if err != nil {
		return nil, err
	}
	fileInfo, err := osFile.Stat()
	if err != nil {
		return nil, err
	}
	_, err = io.Copy(w, osFile)
	if err != nil {
		return nil, err
	}
	return filetypes.NewLocalFileMeta(fileInfo), nil
}

func (b *SystemBundleStoreConnection) GetItemAttachments(creator bundlestore.FileCreator, item meta.AttachableItem) error {
	return nil
}

func (b *SystemBundleStoreConnection) DeleteBundle() error {
	return errors.New("tried to delete bundle in System Bundle Store")
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

func (b *SystemBundleStoreConnection) SetBundleZip(reader io.ReaderAt, size int64) error {
	return errors.New("tried to upload bundle zip in System Bundle Store")
}

func (b *SystemBundleStoreConnection) GetBundleZip(writer io.Writer, zipoptions *bundlestore.BundleZipOptions) error {
	return errors.New("tried to download bundle zip in System Bundle Store")
}
