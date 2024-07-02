package localbundlestore

import (
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/filebundlestore"
	"github.com/thecloudmasters/uesio/pkg/fileadapt/localfiles"
)

type LocalBundleStore struct{}

func (b *LocalBundleStore) GetConnection(options bundlestore.ConnectionOptions) bundlestore.BundleStoreConnection {
	return &filebundlestore.FileBundleStoreConnection{
		FileConnection: &localfiles.Connection{},
		Cache:          nil,
		PathFunc:       getBasePath,
		ReadOnly:       true,
	}
}

func getBasePath(namespace, version string) string {
	return filepath.Join("bundle")
}
