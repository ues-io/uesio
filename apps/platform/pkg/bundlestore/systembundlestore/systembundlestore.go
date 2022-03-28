package systembundlestore

import (
	"bufio"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// SystemBundleStore struct
type SystemBundleStore struct {
}

func getBasePath(namespace, version string) string {
	// We're ignoring the version here because we always get the latest
	return filepath.Join("..", "..", "libs", "apps", namespace, "bundle")
}

func getStream(namespace string, version string, objectname string, filename string) (io.ReadCloser, error) {
	filePath := filepath.Join(getBasePath(namespace, version), objectname, filename)

	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	reader := bufio.NewReader(file)
	return bundlestore.ItemResponse{
		Reader: reader,
		Closer: file,
	}, nil
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

// GetItem function
func (b *SystemBundleStore) GetItem(item meta.BundleableItem, version string, session *sess.Session) error {
	key := item.GetKey()
	namespace := item.GetNamespace()
	fullCollectionName := item.GetCollectionName()
	collectionName := meta.GetNameKeyPart(fullCollectionName)
	app := session.GetContextAppName()
	permSet := session.GetContextPermissions()

	hasPermission := permSet.HasPermission(item.GetPermChecker())
	if !hasPermission {
		return bundlestore.NewPermissionError("No Permission to metadata item: " + key)
	}

	cachedItem, ok := bundle.GetItemFromCache(namespace, version, fullCollectionName, key)

	if ok {
		if app != namespace && !cachedItem.IsPublic() {
			return bundlestore.NewPermissionError("Metadata item: " + key + " is not public")
		}
		meta.Copy(item, cachedItem)
		return nil
	}

	stream, err := getStream(namespace, version, collectionName, item.GetPath())
	if err != nil {
		return err
	}
	defer stream.Close()
	err = bundlestore.DecodeYAML(item, stream)
	if err != nil {
		return err
	}
	if app != namespace && !item.IsPublic() {
		return bundlestore.NewPermissionError("Metadata item: " + key + " is not public")
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
	basePath := filepath.Join(getBasePath(namespace, version), meta.GetNameKeyPart(group.GetName()), "") + string(os.PathSeparator)

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
	}

	return nil
}

func (b *SystemBundleStore) GetFileStream(version string, file *meta.File, session *sess.Session) (io.ReadCloser, error) {
	return getStream(file.Namespace, version, "files", file.GetFilePath())
}

func (b *SystemBundleStore) GetBotStream(version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	return getStream(bot.Namespace, version, "bot", bot.GetBotFilePath())
}

func (b *SystemBundleStore) GetGenerateBotTemplateStream(template, version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	return getStream(bot.Namespace, version, "bot", bot.GetGenerateBotTemplateFilePath(template))
}

func (b *SystemBundleStore) GetComponentPackStream(version string, buildMode bool, componentPack *meta.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	fileName := componentPack.GetComponentPackFilePath(buildMode)
	return getStream(componentPack.Namespace, version, "componentpack", fileName)
}

// StoreItems function
func (b *SystemBundleStore) StoreItems(namespace string, version string, itemStreams []bundlestore.ItemStream, session *sess.Session) error {
	return errors.New("Cannot Write to System Bundle Store")
}

// GetBundleDef function
func (b *SystemBundleStore) GetBundleDef(namespace, version string, session *sess.Session) (*meta.BundleDef, error) {
	var by meta.BundleDef
	stream, err := getStream(namespace, version, "", "bundle.yaml")
	if err != nil {
		return nil, err
	}
	defer stream.Close()

	err = bundlestore.DecodeYAML(&by, stream)
	if err != nil {
		return nil, err
	}
	return &by, nil
}
