package systembundlestore

import (
	"path"
	"time"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/filebundlestore"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/fileadapt/localfiles"
)

// Bundle entries should be very long-lived, so we will allow them to live in memory for a relatively long time,
// and only expire them infrequently because the cost of doing a filesystem read is quite high.
// TODO: Consider pre-loading common bundles into the cache on init, to prevent initial requests from being slow.
var bundleStoreCache *bundle.BundleStoreCache

func init() {
	// system bundle store cache - on by default
	if env.ShouldCacheSiteBundles() {
		bundleStoreCache = bundle.NewBundleStoreCache(15*time.Minute, 15*time.Minute)
	}
}

func getBasePath(namespace, version string) string {
	// We're ignoring the version here because we always get the latest
	return path.Join("..", "..", "libs", "apps", namespace, "bundle")
}

type SystemBundleStore struct{}

func (b *SystemBundleStore) GetConnection(options bundlestore.ConnectionOptions) (bundlestore.BundleStoreConnection, error) {
	return &filebundlestore.FileBundleStoreConnection{
		ConnectionOptions: options,
		FileConnection:    &localfiles.Connection{},
		Cache:             bundleStoreCache,
		PathFunc:          getBasePath,
		ReadOnly:          false,
	}, nil
}

func InvalidateCache() error {
	if bundleStoreCache != nil {
		return bundleStoreCache.InvalidateCache()
	}

	return nil
}
