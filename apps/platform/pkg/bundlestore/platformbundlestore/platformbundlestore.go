package platformbundlestore

import (
	"io"

	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
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
func (b *PlatformBundleStore) GetItems(group metadata.BundleableGroup, namespace, version string, conditions reqs.BundleConditions, session *sess.Session) error {
	return nil
}

// GetFileStream function
func (b *PlatformBundleStore) GetFileStream(namespace, version string, file *metadata.File, session *sess.Session) (io.ReadCloser, string, error) {
	return nil, "", nil
}

// GetComponentPackStream function
func (b *PlatformBundleStore) GetComponentPackStream(namespace, version string, buildMode bool, componentPack *metadata.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	return nil, nil
}

// StoreItems function
func (b *PlatformBundleStore) StoreItems(namespace string, version string, itemStreams []reqs.ItemStream) error {
	return nil
}

// GetBundleDef function
func (b *PlatformBundleStore) GetBundleDef(namespace, version string, session *sess.Session) (*metadata.BundleDef, error) {
	return nil, nil
}
