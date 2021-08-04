package systembundlestore

import (
	"bufio"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/jinzhu/copier"
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
	return filepath.Join("..", "..", "libs", "uesioapps", namespace, "bundle")
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

// GetItem function
func (b *SystemBundleStore) GetItem(item meta.BundleableItem, version string, session *sess.Session) error {
	key := item.GetKey()
	namespace := item.GetNamespace()
	collectionName := meta.GetNameKeyPart(item.GetCollectionName())

	permSet := session.GetContextPermissions()

	hasPermission := permSet.HasPermission(item.GetPermChecker())
	if !hasPermission {
		return bundlestore.NewPermissionError("No Permission to metadata item: " + key)
	}

	cachedItem, ok := bundle.GetItemFromCache(namespace, version, collectionName, key)

	if ok {
		// We got a cache hit
		return copier.Copy(item, cachedItem)
	}

	stream, err := getStream(namespace, version, collectionName, item.GetPath())
	if err != nil {
		return err
	}
	defer stream.Close()
	return bundlestore.DecodeYAML(item, stream)

}

// GetItems function
func (b *SystemBundleStore) GetItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) error {

	// TODO: Think about caching this, but remember conditions
	basePath := filepath.Join(getBasePath(namespace, version), meta.GetNameKeyPart(group.GetName()), "") + string(os.PathSeparator)
	keys := []string{}
	err := filepath.Walk(basePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			// Ignore walking errors
			return nil
		}
		if path == basePath {
			return nil
		}
		key, err := group.GetKeyFromPath(strings.TrimPrefix(path, basePath), conditions)
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
		return err
	}

	for _, key := range keys {
		retrievedItem, err := group.NewBundleableItemWithKey(key)
		if err != nil {
			return err
		}
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

// GetFileStream function
func (b *SystemBundleStore) GetFileStream(version string, file *meta.File, session *sess.Session) (io.ReadCloser, error) {
	return getStream(file.Namespace, version, "files", file.GetFilePath())
}

// GetBotStream function
func (b *SystemBundleStore) GetBotStream(version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	return getStream(bot.Namespace, version, "bots", bot.GetBotFilePath())
}

// GetComponentPackStream function
func (b *SystemBundleStore) GetComponentPackStream(version string, buildMode bool, componentPack *meta.ComponentPack, session *sess.Session) (io.ReadCloser, error) {

	fileName := filepath.Join(componentPack.GetKey(), "runtime.bundle.js")
	if buildMode {
		fileName = filepath.Join(componentPack.GetKey(), "builder.bundle.js")
	}
	return getStream(componentPack.Namespace, version, "componentpacks", fileName)
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
