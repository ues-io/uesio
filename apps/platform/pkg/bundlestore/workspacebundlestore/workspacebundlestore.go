package workspacebundlestore

import (
	"io"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// WorkspaceBundleStore struct
type WorkspaceBundleStore struct {
}

// GetItem function
func (b *WorkspaceBundleStore) GetItem(namespace string, version string, objectname string, name string) (io.ReadCloser, error) {
	return nil, nil
}

// ListItems function
func (b *WorkspaceBundleStore) ListItems(namespace string, version string, objectname string) ([]string, error) {
	return nil, nil
}

// StoreItems function
func (b *WorkspaceBundleStore) StoreItems(namespace string, version string, itemStreams []reqs.ItemStream) error {
	return nil
}
