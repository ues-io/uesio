package platformbundlestore

import (
	"errors"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/fileadapt/s3"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// PlatformBundleStore struct
type PlatformBundleStore struct {
}

// System variables
var BUNDLE_STORE_BUCKET_NAME string

func init() {
	val, ok := os.LookupEnv("UESIO_BUNDLE_STORE_BUCKET_NAME")
	if !ok {
		log.Fatal("Could not get environment variable: UESIO_BUNDLE_STORE_BUCKET_NAME")
	}
	BUNDLE_STORE_BUCKET_NAME = val
}

func getBasePath(namespace, version string) string {
	// We're ignoring the version here because we always get the latest
	return filepath.Join(namespace, version, "bundle")
}

func getStream(namespace string, version string, objectname string, filename string, session *sess.Session) (io.ReadCloser, error) {
	filePath := filepath.Join(getBasePath(namespace, version), objectname, filename)

	fileAdapter := &s3.FileAdapter{}

	fakeSession, err := auth.GetStudioAdminSession()
	if err != nil {
		return nil, err
	}

	credentials, err := adapt.GetCredentials("uesio.aws", fakeSession)
	if err != nil {
		return nil, err
	}

	conn, err := fileAdapter.GetFileConnection(credentials)
	if err != nil {
		return nil, err
	}

	return conn.Download(filePath)

}

// GetItem function
func (b *PlatformBundleStore) GetItem(item meta.BundleableItem, version string, session *sess.Session) error {
	key := item.GetKey()
	namespace := item.GetNamespace()
	collectionName := item.GetBundleGroup().GetBundleFolderName()
	app := session.GetContextAppName()
	permSet := session.GetContextPermissions()

	hasPermission := permSet.HasPermission(item.GetPermChecker())
	if !hasPermission {
		return bundlestore.NewPermissionError("No Permission to metadata item: " + key)
	}

	cachedItem, ok := bundle.GetItemFromCache(namespace, version, collectionName, key)

	if ok {
		if app != namespace && !cachedItem.IsPublic() {
			return bundlestore.NewPermissionError("Metadata item: " + key + " is not public")
		}
		meta.Copy(item, cachedItem)
		return nil
	}
	stream, err := getStream(namespace, version, collectionName, item.GetPath(), session)
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

func (b *PlatformBundleStore) HasAny(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) (bool, error) {
	err := b.GetAllItems(group, namespace, version, conditions, session)
	if err != nil {
		return false, err
	}
	return group.Len() > 0, nil
}

func (b *PlatformBundleStore) GetManyItems(items []meta.BundleableItem, version string, session *sess.Session) error {
	for _, item := range items {
		err := b.GetItem(item, version, session)
		if err != nil {
			return err
		}
	}
	return nil
}

func (b *PlatformBundleStore) GetAllItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) error {
	// TODO: Think about caching this, but remember conditions
	basePath := filepath.Join(getBasePath(namespace, version), group.GetBundleFolderName()) + string(os.PathSeparator)
	keys := []string{}

	fileAdapter := &s3.FileAdapter{}
	credentials, err := adapt.GetCredentials("uesio.aws", session)
	if err != nil {
		return err
	}

	conn, err := fileAdapter.GetFileConnection(credentials)
	if err != nil {
		return err
	}

	paths, err := conn.List(basePath)
	if err != nil {
		return err
	}

	for _, path := range paths {

		key, err := group.GetKeyFromPath(strings.TrimPrefix(path, basePath), namespace, conditions)
		if err != nil {
			logger.LogError(err)
			continue
		}
		if key == "" {
			continue
		}
		keys = append(keys, key)
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

func (b *PlatformBundleStore) GetFileStream(version string, file *meta.File, session *sess.Session) (io.ReadCloser, error) {
	return getStream(file.Namespace, version, "files", file.GetFilePath(), session)
}

func (b *PlatformBundleStore) GetComponentPackStream(version string, buildMode bool, componentPack *meta.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	fileName := componentPack.GetComponentPackFilePath(buildMode)
	return getStream(componentPack.Namespace, version, "componentpacks", fileName, session)
}

func (b *PlatformBundleStore) GetBotStream(version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	return getStream(bot.Namespace, version, "bots", bot.GetBotFilePath(), session)
}

func (b *PlatformBundleStore) GetGenerateBotTemplateStream(template, version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	return getStream(bot.Namespace, version, "bots", bot.GetGenerateBotTemplateFilePath(template), session)
}

// StoreItems function
func (b *PlatformBundleStore) StoreItems(namespace string, version string, itemStreams []bundlestore.ItemStream, session *sess.Session) error {
	for _, itemStream := range itemStreams {
		err := storeItem(namespace, version, itemStream, session)
		if err != nil {
			return err
		}
	}
	return nil
}

func storeItem(namespace string, version string, itemStream bundlestore.ItemStream, session *sess.Session) error {
	fullFilePath := filepath.Join(getBasePath(namespace, version), itemStream.Type, itemStream.FileName)

	fileAdapter := &s3.FileAdapter{}

	credentials, err := adapt.GetCredentials("uesio.aws", session)
	if err != nil {
		return err
	}

	conn, err := fileAdapter.GetFileConnection(credentials)
	if err != nil {
		return err
	}

	err = conn.Upload(itemStream.File, fullFilePath)
	if err != nil {
		return errors.New("Error Writing File: " + err.Error())
	}

	return nil
}

// GetBundleDef function
func (b *PlatformBundleStore) GetBundleDef(namespace, version string, session *sess.Session) (*meta.BundleDef, error) {
	var by meta.BundleDef
	stream, err := getStream(namespace, version, "", "bundle.yaml", session)
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
