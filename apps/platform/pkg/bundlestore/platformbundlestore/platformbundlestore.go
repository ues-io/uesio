package platformbundlestore

import (
	"context"
	"os"
	"path/filepath"
	"time"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/filebundlestore"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/file"
)

// Bundle entries here should be fairly long-lived because (a) bundles are immutable (b) the cost of retrieval is high.
var bundleStoreCache *bundle.BundleStoreCache
var platformFileConnection file.Connection

func init() {
	// on by default
	if os.Getenv("UESIO_CACHE_SITE_BUNDLES") != "false" {
		bundleStoreCache = bundle.NewBundleStoreCache(4*time.Hour, 15*time.Minute)
	}
}

type PlatformBundleStore struct{}

func (b *PlatformBundleStore) GetConnection(options bundlestore.ConnectionOptions) (bundlestore.BundleStoreConnection, error) {
	if platformFileConnection == nil {
		var err error
		platformFileConnection, err = fileadapt.GetFileConnection("uesio/core.bundlestore", sess.GetStudioAnonSession(context.Background()))
		if err != nil {
			return nil, err
		}
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
