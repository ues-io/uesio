package platformbundlestore

import (
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/jinzhu/copier"
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
var (
	BundleStoreBucketName string
	SystemSetUp           error
)

func init() {
	SystemSetUp = InitSystemEnv()
}

//InitSystemEnv inits System variables
func InitSystemEnv() error {

	val, ok := os.LookupEnv("UESIO_BUNDLE_STORE_BUCKET_NAME")
	if !ok {
		return errors.New("Could not get environment variable: UESIO_BUNDLE_STORE_BUCKET_NAME")
	}
	BundleStoreBucketName = val

	return nil

}

func getBasePath(namespace, version string) string {
	// We're ignoring the version here because we always get the latest
	return filepath.Join(namespace, version, "bundle")
}

func getStream(namespace string, version string, objectname string, filename string, session *sess.Session) (io.ReadCloser, error) {
	filePath := filepath.Join(getBasePath(namespace, version), objectname, filename)

	fileAdapter := &s3.FileAdapter{}

	fakeSession, err := auth.GetHeadlessSession()
	if err != nil {
		return nil, err
	}

	credentials, err := adapt.GetCredentials("uesio.aws", fakeSession)
	if err != nil {
		return nil, err
	}

	return fileAdapter.Download(BundleStoreBucketName, filePath, credentials)

}

// GetItem function
func (b *PlatformBundleStore) GetItem(item meta.BundleableItem, version string, session *sess.Session) error {
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
	stream, err := getStream(namespace, version, collectionName, item.GetPath(), session)
	if err != nil {
		return err
	}
	defer stream.Close()
	return bundlestore.DecodeYAML(item, stream)
}

// GetItems function
func (b *PlatformBundleStore) GetItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) error {
	// TODO: Think about caching this, but remember conditions
	basePath := filepath.Join(getBasePath(namespace, version), meta.GetNameKeyPart(group.GetName()), "") + string(os.PathSeparator)
	keys := []string{}

	fileAdapter := &s3.FileAdapter{}
	credentials, err := adapt.GetCredentials("uesio.aws", session)
	if err != nil {
		return err
	}

	s3Result, err := fileAdapter.List(BundleStoreBucketName, basePath, credentials)

	for _, fileMetadata := range s3Result.Contents {
		path := *fileMetadata.Key
		key, err := group.GetKeyFromPath(strings.TrimPrefix(path, basePath), conditions)
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
func (b *PlatformBundleStore) GetFileStream(version string, file *meta.File, session *sess.Session) (io.ReadCloser, error) {
	return getStream(file.Namespace, version, "files", file.GetFilePath(), session)
}

// GetComponentPackStream function
func (b *PlatformBundleStore) GetComponentPackStream(version string, buildMode bool, componentPack *meta.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	fileName := filepath.Join(componentPack.GetKey(), "runtime.bundle.js")
	if buildMode {
		fileName = filepath.Join(componentPack.GetKey(), "builder.bundle.js")
	}
	return getStream(componentPack.Namespace, version, "componentpacks", fileName, session)
}

// GetBotStream function
func (b *PlatformBundleStore) GetBotStream(version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	return getStream(bot.Namespace, version, "bots", bot.GetBotFilePath(), session)
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

	err = fileAdapter.Upload(&itemStream.Buffer, BundleStoreBucketName, fullFilePath, credentials)
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
