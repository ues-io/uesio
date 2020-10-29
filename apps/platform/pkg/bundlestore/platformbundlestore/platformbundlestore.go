package platformbundlestore

import (
	"io"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// FileAdapter struct
type PlatformBundleStore struct {
}

func (b *PlatformBundleStore) GetItem(namespace string, version string, objectname string, name string) (io.ReadCloser, error) {
	return nil, nil
}

func (b *PlatformBundleStore) ListItems(namespace string, version string, objectname string) ([]string, error) {
	return nil, nil
}

func (b *PlatformBundleStore) StoreItems(namespace string, version string, itemStreams []reqs.ItemStream) error {
	return nil
}
