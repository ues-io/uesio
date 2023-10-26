package localbundlestore

import (
	"errors"
	"io"
	"os"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/systembundlestore"
	"github.com/thecloudmasters/uesio/pkg/fileadapt/localfiles"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type LocalBundleStore struct{}

func getBasePath(namespace, version string) string {
	return filepath.Join("bundle")
}

func getFile(namespace string, version string, objectname string, filename string) (*os.File, error) {
	filePath := filepath.Join(getBasePath(namespace, version), objectname, filename)
	return os.Open(filePath)
}

func getFileInfo(namespace string, version string, objectname string, filename string) (os.FileInfo, error) {
	filePath := filepath.Join(getBasePath(namespace, version), objectname, filename)
	return os.Stat(filePath)
}

func (b *LocalBundleStore) GetItem(item meta.BundleableItem, version string, session *sess.Session) error {
	namespace := item.GetNamespace()
	collectionName := item.GetBundleFolderName()

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

	return nil

}

func (b *LocalBundleStore) HasAny(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) (bool, error) {
	err := b.GetAllItems(group, namespace, version, conditions, session)
	if err != nil {
		return false, err
	}
	return group.Len() > 0, nil
}

func (b *LocalBundleStore) GetManyItems(items []meta.BundleableItem, version string, session *sess.Session) error {
	for _, item := range items {
		err := b.GetItem(item, version, session)
		if err != nil {
			return err
		}
	}
	return nil
}

func (b *LocalBundleStore) GetAllItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) error {

	// TODO: Think about caching this, but remember conditions
	basePath := filepath.Join(getBasePath(namespace, version), group.GetBundleFolderName()) + string(os.PathSeparator)

	conn := localfiles.Connection{}
	paths, err := systembundlestore.GetFilePaths(basePath, group, conditions, &conn)
	if err != nil {
		return err
	}

	for _, path := range paths {
		retrievedItem := group.GetItemFromPath(path, namespace)
		if retrievedItem == nil {
			continue
		}

		err = b.GetItem(retrievedItem, version, session)
		if err != nil {
			if _, ok := err.(*bundlestore.PermissionError); ok {
				continue
			}
			if _, ok := err.(*bundlestore.NotFoundError); ok {
				continue
			}
			return err
		}
		if bundlestore.DoesItemMeetBundleConditions(retrievedItem, conditions) {
			group.AddItem(retrievedItem)
		}
	}

	return nil
}

func (b *LocalBundleStore) GetItemAttachment(item meta.AttachableItem, version string, path string, session *sess.Session) (io.ReadCloser, error) {
	return getFile(item.GetNamespace(), version, item.GetBundleFolderName(), filepath.Join(item.GetBasePath(), path))
}

func (b *LocalBundleStore) GetAttachmentPaths(item meta.AttachableItem, version string, session *sess.Session) ([]string, error) {
	return nil, nil
}

func (b *LocalBundleStore) StoreItem(namespace, version, path string, reader io.Reader, session *sess.Session) error {
	return errors.New("Cannot Write to System Bundle Store")
}

func (b *LocalBundleStore) GetBundleDef(namespace, version string, session *sess.Session, connection adapt.Connection) (*meta.BundleDef, error) {
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

func (b *LocalBundleStore) HasAllItems(items []meta.BundleableItem, version string, session *sess.Session, connection adapt.Connection) error {
	for _, item := range items {
		err := b.GetItem(item, version, session)
		if err != nil {
			return err
		}
	}
	return nil
}
