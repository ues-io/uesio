package systembundlestore

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/fileadapt/localfiles"
	"github.com/thecloudmasters/uesio/pkg/licensing"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type SystemBundleStore struct{}

func getBasePath(namespace, version string) string {
	// We're ignoring the version here because we always get the latest
	return filepath.Join("..", "..", "libs", "apps", namespace, "bundle")
}

func getFile(namespace string, version string, objectname string, filename string) (*os.File, error) {
	filePath := filepath.Join(getBasePath(namespace, version), objectname, filename)
	return os.Open(filePath)
}

func GetFilePaths(basePath string, group meta.BundleableGroup, conditions meta.BundleConditions, conn fileadapt.FileConnection) ([]string, error) {

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

func (b *SystemBundleStore) GetItem(item meta.BundleableItem, version string, session *sess.Session, connection adapt.Connection) error {
	key := item.GetKey()
	namespace := item.GetNamespace()
	fullCollectionName := item.GetCollectionName()
	collectionName := item.GetBundleFolderName()
	app := session.GetContextAppName()
	permSet := session.GetContextPermissions()

	hasPermission := permSet.HasPermission(item.GetPermChecker())
	if !hasPermission {
		message := fmt.Sprintf("No Permission to metadata item: %s : %s : %s : %s", item.GetCollectionName(), key, session.GetUserInfo().UniqueKey, session.GetProfile())
		return bundlestore.NewPermissionError(message)
	}

	cachedItem, ok := bundle.GetItemFromCache(namespace, version, fullCollectionName, key)

	if ok {
		if app != namespace && !cachedItem.IsPublic() {
			message := fmt.Sprintf("Metadata item: %s is not public", key)
			return bundlestore.NewPermissionError(message)
		}
		meta.Copy(item, cachedItem)
		return nil
	}

	file, err := getFile(namespace, version, collectionName, item.GetPath())
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
	if app != namespace && !item.IsPublic() {
		message := fmt.Sprintf("Metadata item: %s is not public", key)
		return bundlestore.NewPermissionError(message)
	}
	bundle.AddItemToCache(item, namespace, version)
	return nil

}

func (b *SystemBundleStore) HasAny(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session, connection adapt.Connection) (bool, error) {
	err := b.GetAllItems(group, namespace, version, conditions, session, connection)
	if err != nil {
		return false, err
	}
	return group.Len() > 0, nil
}

func (b *SystemBundleStore) GetManyItems(items []meta.BundleableItem, version string, session *sess.Session, connection adapt.Connection) error {
	for _, item := range items {
		err := b.GetItem(item, version, session, connection)
		if err != nil {
			return err
		}
	}
	return nil
}

func (b *SystemBundleStore) GetAllItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session, connection adapt.Connection) error {

	// TODO: Think about caching this, but remember conditions
	basePath := filepath.Join(getBasePath(namespace, version), group.GetBundleFolderName()) + string(os.PathSeparator)

	conn := localfiles.Connection{}
	paths, err := GetFilePaths(basePath, group, conditions, &conn)
	if err != nil {
		return err
	}

	for _, path := range paths {

		retrievedItem := group.GetItemFromPath(path, namespace)
		if retrievedItem == nil {
			continue
		}

		err = b.GetItem(retrievedItem, version, session, connection)
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

func (b *SystemBundleStore) GetItemAttachment(item meta.AttachableItem, version string, path string, session *sess.Session) (time.Time, io.ReadCloser, error) {
	file, err := getFile(item.GetNamespace(), version, item.GetBundleFolderName(), filepath.Join(item.GetBasePath(), path))
	if err != nil {
		return time.Time{}, nil, err
	}
	fileInfo, err := file.Stat()
	if err != nil {
		return time.Time{}, nil, err
	}
	return fileInfo.ModTime(), file, nil
}

func (b *SystemBundleStore) GetAttachmentPaths(item meta.AttachableItem, version string, session *sess.Session) ([]string, error) {
	return nil, nil
}

func (b *SystemBundleStore) StoreItem(namespace, version, path string, reader io.Reader, session *sess.Session) error {
	return errors.New("Cannot Write to System Bundle Store")
}

func (b *SystemBundleStore) DeleteBundle(namespace, version string, session *sess.Session) error {
	return errors.New("Tried to delete bundle in System Bundle Store")
}

func (b *SystemBundleStore) GetBundleDef(namespace, version string, session *sess.Session, connection adapt.Connection) (*meta.BundleDef, error) {
	var by meta.BundleDef
	file, err := getFile(namespace, version, "", "bundle.yaml")
	if err != nil {
		return nil, err
	}
	defer file.Close()

	licenseMap, err := licensing.GetLicenses(namespace, connection)
	if err != nil {
		return nil, err
	}
	by.Licenses = licenseMap

	err = bundlestore.DecodeYAML(&by, file)
	if err != nil {
		return nil, err
	}
	return &by, nil
}

func (b *SystemBundleStore) HasAllItems(items []meta.BundleableItem, version string, session *sess.Session, connection adapt.Connection) error {
	for _, item := range items {
		err := b.GetItem(item, version, session, connection)
		if err != nil {
			return err
		}
	}
	return nil
}
