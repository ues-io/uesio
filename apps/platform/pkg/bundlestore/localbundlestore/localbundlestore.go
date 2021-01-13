package localbundlestore

import (
	"bufio"
	"errors"
	"io"
	"mime"
	"os"
	"path/filepath"
	"strings"

	"github.com/jinzhu/copier"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// LocalBundleStore struct
type LocalBundleStore struct {
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
func (b *LocalBundleStore) GetItem(item metadata.BundleableItem, version string, session *sess.Session) error {
	key := item.GetKey()
	namespace := item.GetNamespace()
	collectionName := item.GetCollectionName()

	permSet := session.GetContextPermissions()

	hasPermission := permSet.HasPermission(item.GetPermChecker())
	if !hasPermission {
		return bundlestore.NewPermissionError("No Permission to metadata item: " + key)
	}

	cachedItem, ok := bundles.GetItemFromCache(namespace, version, collectionName, key)

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
func (b *LocalBundleStore) GetItems(group metadata.BundleableGroup, namespace, version string, conditions metadata.BundleConditions, session *sess.Session) error {

	// TODO: Think about caching this, but remember conditions
	basePath := filepath.Join(getBasePath(namespace, version), group.GetName(), "") + string(os.PathSeparator)
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
			return err
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

		group.AddItem(retrievedItem)
	}

	return nil
}

// GetFileStream function
func (b *LocalBundleStore) GetFileStream(version string, file *metadata.File, session *sess.Session) (io.ReadCloser, error) {
	stream, err := getStream(file.Namespace, version, "files", file.FileName)
	file.MimeType = mime.TypeByExtension(filepath.Ext(file.FileName))
	return stream, err
}

// GetBotStream function
func (b *LocalBundleStore) GetBotStream(version string, bot *metadata.Bot, session *sess.Session) (io.ReadCloser, error) {
	stream, err := getStream(bot.Namespace, version, "bots", bot.GetBotFilePath())
	return stream, err
}

// GetComponentPackStream function
func (b *LocalBundleStore) GetComponentPackStream(version string, buildMode bool, componentPack *metadata.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	name := componentPack.Name
	namespace := componentPack.Namespace
	fileName := namespace + "." + name + ".bundle.js"
	if buildMode {
		fileName = namespace + "." + name + ".builder.bundle.js"
	}
	return getStream(namespace, version, "componentpacks", fileName)
}

// StoreItems function
func (b *LocalBundleStore) StoreItems(namespace string, version string, itemStreams []bundlestore.ItemStream) error {
	for _, itemStream := range itemStreams {
		err := storeItem(namespace, version, itemStream)
		if err != nil {
			return err
		}
	}
	return nil
}

func storeItem(namespace string, version string, itemStream bundlestore.ItemStream) error {
	fullFilePath := filepath.Join(getBasePath(namespace, version), itemStream.Type, itemStream.FileName)
	directory := filepath.Dir(fullFilePath)

	err := os.MkdirAll(directory, 0744)
	if err != nil {
		return err
	}

	outFile, err := os.Create(fullFilePath)
	if err != nil {
		return errors.New("Error Creating File: " + err.Error())
	}
	defer outFile.Close()
	_, err = io.Copy(outFile, &itemStream.Buffer)
	if err != nil {
		return errors.New("Error Writing File: " + err.Error())
	}

	return nil
}

// GetBundleDef function
func (b *LocalBundleStore) GetBundleDef(namespace, version string, session *sess.Session) (*metadata.BundleDef, error) {
	var by metadata.BundleDef
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
