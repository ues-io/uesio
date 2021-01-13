package platformbundlestore

import (
	"io"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// PlatformBundleStore struct
type PlatformBundleStore struct {
}

// GetItem function
func (b *PlatformBundleStore) GetItem(item metadata.BundleableItem, version string, session *sess.Session) error {
	return nil
}

// GetItems function
func (b *PlatformBundleStore) GetItems(group metadata.BundleableGroup, namespace, version string, conditions metadata.BundleConditions, session *sess.Session) error {
	return nil
}

// GetFileStream function
func (b *PlatformBundleStore) GetFileStream(version string, file *metadata.File, session *sess.Session) (io.ReadCloser, error) {
	return nil, nil
}

// GetComponentPackStream function
func (b *PlatformBundleStore) GetComponentPackStream(version string, buildMode bool, componentPack *metadata.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	return nil, nil
}

// GetBotStream function
func (b *PlatformBundleStore) GetBotStream(version string, bot *metadata.Bot, session *sess.Session) (io.ReadCloser, error) {
	return nil, nil
}

// StoreItems function
func (b *PlatformBundleStore) StoreItems(namespace string, version string, itemStreams []bundlestore.ItemStream) error {
	return nil
}

// GetBundleDef function
func (b *PlatformBundleStore) GetBundleDef(namespace, version string, session *sess.Session) (*metadata.BundleDef, error) {
	return nil, nil
}
