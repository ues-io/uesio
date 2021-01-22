package platformbundlestore

import (
	"io"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// PlatformBundleStore struct
type PlatformBundleStore struct {
}

// GetItem function
func (b *PlatformBundleStore) GetItem(item meta.BundleableItem, version string, session *sess.Session) error {
	return nil
}

// GetItems function
func (b *PlatformBundleStore) GetItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) error {
	return nil
}

// GetFileStream function
func (b *PlatformBundleStore) GetFileStream(version string, file *meta.File, session *sess.Session) (io.ReadCloser, error) {
	return nil, nil
}

// GetComponentPackStream function
func (b *PlatformBundleStore) GetComponentPackStream(version string, buildMode bool, componentPack *meta.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	return nil, nil
}

// GetBotStream function
func (b *PlatformBundleStore) GetBotStream(version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	return nil, nil
}

// StoreItems function
func (b *PlatformBundleStore) StoreItems(namespace string, version string, itemStreams []bundlestore.ItemStream) error {
	return nil
}

// GetBundleDef function
func (b *PlatformBundleStore) GetBundleDef(namespace, version string, session *sess.Session) (*meta.BundleDef, error) {
	return nil, nil
}
