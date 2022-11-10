package systembundlestore

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/logger"
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

func getFileInfo(namespace string, version string, objectname string, filename string) (os.FileInfo, error) {
	filePath := filepath.Join(getBasePath(namespace, version), objectname, filename)
	return os.Stat(filePath)
}

func getFileKeys(basePath string, namespace string, group meta.BundleableGroup, conditions meta.BundleConditions) ([]string, error) {

	cachedKeys, ok := bundle.GetFileListFromCache(basePath, conditions)
	if ok {
		return cachedKeys, nil
	}
	keys := []string{}

	err := filepath.Walk(basePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			// Ignore walking errors
			return nil
		}
		if path == basePath {
			return nil
		}
		key, err := group.GetKeyFromPath(strings.TrimPrefix(path, basePath), namespace, conditions)
		if err != nil {
			logger.LogError(err)
			return nil
		}
		if key == "" {
			return nil
		}
		keys = append(keys, key)

		return nil
	})
	if err != nil {
		return nil, err
	}
	bundle.AddFileListToCache(basePath, conditions, keys)
	return keys, err
}

func (b *SystemBundleStore) GetItem(item meta.BundleableItem, version string, session *sess.Session) error {
	key := item.GetKey()
	namespace := item.GetNamespace()
	fullCollectionName := item.GetCollectionName()
	collectionName := item.GetBundleGroup().GetBundleFolderName()
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

	fileInfo, err := getFileInfo(namespace, version, collectionName, item.GetPath())
	if err != nil {
		return err
	}

	item.SetModified(fileInfo.ModTime())

	file, err := getFile(namespace, version, collectionName, item.GetPath())
	if err != nil {
		return err
	}

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

func (b *SystemBundleStore) HasAny(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) (bool, error) {
	err := b.GetAllItems(group, namespace, version, conditions, session)
	if err != nil {
		return false, err
	}
	return group.Len() > 0, nil
}

func (b *SystemBundleStore) GetManyItems(items []meta.BundleableItem, version string, session *sess.Session) error {
	for _, item := range items {
		err := b.GetItem(item, version, session)
		if err != nil {
			return err
		}
	}
	return nil
}

func (b *SystemBundleStore) GetAllItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) error {

	// TODO: Think about caching this, but remember conditions
	basePath := filepath.Join(getBasePath(namespace, version), group.GetBundleFolderName()) + string(os.PathSeparator)

	keys, err := getFileKeys(basePath, namespace, group, conditions)
	if err != nil {
		return err
	}

	for _, key := range keys {
		retrievedItem, err := group.NewBundleableItemWithKey(key)
		if err != nil {
			return err
		}
		retrievedItem.SetNamespace(namespace)
		err = b.GetItem(retrievedItem, version, session)
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

func (b *SystemBundleStore) GetFileStream(version string, file *meta.File, session *sess.Session) (io.ReadCloser, error) {
	return getFile(file.Namespace, version, "files", file.GetFilePath())
}

func (b *SystemBundleStore) GetBotStream(version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	return getFile(bot.Namespace, version, "bots", bot.GetBotFilePath())
}

func (b *SystemBundleStore) GetGenerateBotTemplateStream(template, version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	return getFile(bot.Namespace, version, "bots", bot.GetGenerateBotTemplateFilePath(template))
}

func (b *SystemBundleStore) GetComponentPackStream(version string, path string, componentPack *meta.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	fileInfo, err := getFileInfo(componentPack.Namespace, version, "componentpacks", path)
	if err != nil {
		return nil, err
	}
	componentPack.SetModified(fileInfo.ModTime())
	return getFile(componentPack.Namespace, version, "componentpacks", path)
}

func (b *SystemBundleStore) StoreItems(namespace string, version string, itemStreams []bundlestore.ItemStream, session *sess.Session) error {
	return errors.New("Cannot Write to System Bundle Store")
}

func (b *SystemBundleStore) DeleteBundle(namespace string, version string, session *sess.Session) error {
	return errors.New("Tried to delete bundle in System Bundle Store")
}

func (b *SystemBundleStore) GetBundleDef(namespace, version string, session *sess.Session, connection adapt.Connection) (*meta.BundleDef, error) {
	var by meta.BundleDef
	file, err := getFile(namespace, version, "", "bundle.yaml")
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

func (b *SystemBundleStore) HasAllItems(items []meta.BundleableItem, version string, session *sess.Session, connection adapt.Connection) error {
	for _, item := range items {
		err := b.GetItem(item, version, session)
		if err != nil {
			return err
		}
	}
	return nil
}
