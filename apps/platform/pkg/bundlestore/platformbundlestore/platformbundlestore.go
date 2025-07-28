package platformbundlestore

import (
	"context"
	"path/filepath"
	"sync"
	"time"

	"github.com/go-chi/traceid"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/filebundlestore"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/file"
)

// Bundle entries here should be fairly long-lived because (a) bundles are immutable (b) the cost of retrieval is high.
var bundleStoreCache *bundle.BundleStoreCache
var platformFileConnection file.Connection

var initConnection = sync.OnceValues(func() (file.Connection, error) {
	return fileadapt.GetFileConnection("uesio/core.bundlestore", sess.GetStudioAnonSession(traceid.NewContext(context.Background())))
})

func init() {
	// on by default
	if env.ShouldCacheSiteBundles() {
		bundleStoreCache = bundle.NewBundleStoreCache(4*time.Hour, 15*time.Minute)
	}
}

type PlatformBundleStore struct{}

func (b *PlatformBundleStore) GetConnection(options bundlestore.ConnectionOptions) (bundlestore.BundleStoreConnection, error) {
	platformFileConnection, err := initConnection()
	if err != nil {
		return nil, err
	}
	return &filebundlestore.FileBundleStoreConnection{
		ConnectionOptions: options,
		FileConnection:    platformFileConnection,
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

func getBasePath(namespace, version string) string {
	return filepath.Join(namespace, version, "bundle")
}
