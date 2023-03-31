package platformbundlestore

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
	"github.com/thecloudmasters/uesio/pkg/bundlestore/systembundlestore"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/licensing"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type PlatformBundleStore struct {
}

func getPlatformFileConnection(session *sess.Session) (fileadapt.FileConnection, error) {
	return fileadapt.GetFileConnection("uesio/core.bundlestore", sess.GetStudioAnonSession())
}

func getBasePath(namespace, version string) string {
	return filepath.Join(namespace, version, "bundle")
}

func getStream(namespace string, version string, objectname string, filename string, session *sess.Session) (time.Time, io.ReadSeeker, error) {
	filePath := filepath.Join(getBasePath(namespace, version), objectname, filename)

	conn, err := getPlatformFileConnection(session)
	if err != nil {
		return time.Time{}, nil, err
	}

	return conn.Download(filePath)

}

func (b *PlatformBundleStore) GetItem(item meta.BundleableItem, version string, session *sess.Session, connection adapt.Connection) error {
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
			return bundlestore.NewPermissionError("Metadata item: " + key + " is not public")
		}
		meta.Copy(item, cachedItem)
		return nil
	}
	modTime, stream, err := getStream(namespace, version, collectionName, item.GetPath(), session)
	if err != nil {
		return err
	}

	item.SetModified(modTime)
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

func (b *PlatformBundleStore) HasAny(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session, connection adapt.Connection) (bool, error) {
	err := b.GetAllItems(group, namespace, version, conditions, session, connection)
	if err != nil {
		return false, err
	}
	return group.Len() > 0, nil
}

func (b *PlatformBundleStore) GetManyItems(items []meta.BundleableItem, version string, session *sess.Session, connection adapt.Connection) error {
	for _, item := range items {
		err := b.GetItem(item, version, session, connection)
		if err != nil {
			return err
		}
	}
	return nil
}

func (b *PlatformBundleStore) GetAllItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session, connection adapt.Connection) error {
	// TODO: Think about caching this, but remember conditions
	basePath := filepath.Join(getBasePath(namespace, version), group.GetBundleFolderName()) + string(os.PathSeparator)

	conn, err := getPlatformFileConnection(session)
	if err != nil {
		return err
	}
	paths, err := systembundlestore.GetFilePaths(basePath, group, conditions, conn)
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

func (b *PlatformBundleStore) GetItemAttachment(item meta.AttachableItem, version string, path string, session *sess.Session) (time.Time, io.ReadSeeker, error) {
	return getStream(item.GetNamespace(), version, item.GetBundleFolderName(), filepath.Join(item.GetBasePath(), path), session)
}

func (b *PlatformBundleStore) GetAttachmentPaths(item meta.AttachableItem, version string, session *sess.Session) ([]string, error) {
	return nil, nil
}

func (b *PlatformBundleStore) StoreItem(namespace, version, path string, reader io.Reader, session *sess.Session) error {

	fullFilePath := filepath.Join(getBasePath(namespace, version), path)

	conn, err := getPlatformFileConnection(session)
	if err != nil {
		return err
	}

	err = conn.Upload(reader, fullFilePath)
	if err != nil {
		return errors.New("Error Writing File: " + err.Error())
	}

	return nil
}

func (b *PlatformBundleStore) DeleteBundle(namespace, version string, session *sess.Session) error {

	fullFilePath := filepath.Join(namespace, version)

	conn, err := getPlatformFileConnection(session)
	if err != nil {
		return err
	}

	err = conn.EmptyDir(fullFilePath)
	if err != nil {
		return errors.New("Error Deleting Bundle: " + err.Error())
	}

	return nil
}

func (b *PlatformBundleStore) GetBundleDef(namespace, version string, session *sess.Session, connection adapt.Connection) (*meta.BundleDef, error) {
	var by meta.BundleDef
	_, stream, err := getStream(namespace, version, "", "bundle.yaml", session)
	if err != nil {
		return nil, err
	}

	licenseMap, err := licensing.GetLicenses(namespace, connection)
	if err != nil {
		return nil, err
	}
	by.Licenses = licenseMap

	err = bundlestore.DecodeYAML(&by, stream)
	if err != nil {
		return nil, err
	}
	return &by, nil
}

func (b *PlatformBundleStore) HasAllItems(items []meta.BundleableItem, version string, session *sess.Session, connection adapt.Connection) error {
	for _, item := range items {
		err := b.GetItem(item, version, session, connection)
		if err != nil {
			return err
		}
	}
	return nil
}
