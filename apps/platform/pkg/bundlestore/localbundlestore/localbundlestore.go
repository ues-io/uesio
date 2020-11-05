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
	"github.com/thecloudmasters/uesio/pkg/reqs"
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
	return reqs.ItemResponse{
		Reader: reader,
		Closer: file,
	}, nil
}

// ListItems function
func listItems(namespace, version, objectname, prefix string, session *sess.Session) ([]string, error) {
	dirPath := filepath.Join(getBasePath(namespace, version), objectname)
	d, err := os.Open(dirPath)
	if err != nil {
		return []string{}, nil
	}
	defer d.Close()
	names, err := d.Readdirnames(-1)
	if err != nil {
		return []string{}, nil
	}
	keys := []string{}
	for _, fileName := range names {
		if prefix != "" && !strings.HasPrefix(fileName, prefix) {
			continue
		}
		if !strings.HasSuffix(fileName, ".yaml") {
			continue
		}
		keys = append(keys, strings.TrimSuffix(fileName, ".yaml"))
	}
	return keys, nil
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

	stream, err := getStream(namespace, version, collectionName, key+".yaml")
	if err != nil {
		return err
	}
	defer stream.Close()
	return bundlestore.DecodeYAML(item, stream)

}

// GetItems function
func (b *LocalBundleStore) GetItems(group metadata.BundleableGroup, namespace, version string, conditions reqs.BundleConditions, session *sess.Session) error {
	bundleGroupName := group.GetName()
	keys, ok := bundles.GetFileListFromCache(namespace, version, bundleGroupName)
	var err error
	if !ok {
		prefix := group.GetKeyPrefix(conditions)
		keys, err = listItems(namespace, version, bundleGroupName, prefix, session)
		if err != nil {
			return err
		}
		bundles.AddFileListToCache(namespace, version, bundleGroupName, keys)
	}

	for _, key := range keys {
		retrievedItem, err := group.NewItem(key)
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
func (b *LocalBundleStore) GetFileStream(namespace, version string, file *metadata.File, session *sess.Session) (io.ReadCloser, string, error) {
	stream, err := getStream(namespace, version, "files", file.FileName)
	return stream, mime.TypeByExtension(filepath.Ext(file.FileName)), err
}

// GetComponentPackStream function
func (b *LocalBundleStore) GetComponentPackStream(namespace, version string, buildMode bool, componentPack *metadata.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	name := componentPack.Name
	fileName := namespace + "." + name + ".bundle.js"
	if buildMode {
		fileName = namespace + "." + name + ".builder.bundle.js"
	}
	return getStream(namespace, version, "componentpacks", fileName)
}

// StoreItems function
func (b *LocalBundleStore) StoreItems(namespace string, version string, itemStreams []reqs.ItemStream) error {
	for _, itemStream := range itemStreams {
		err := storeItem(namespace, version, itemStream)
		if err != nil {
			return err
		}
	}
	return nil
}

func storeItem(namespace string, version string, itemStream reqs.ItemStream) error {
	fullFilePath := filepath.Join(getBasePath(namespace, version), itemStream.Path)
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
