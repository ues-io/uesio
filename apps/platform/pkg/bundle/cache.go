package bundle

import (
	"fmt"
	"time"

	"github.com/qdm12/reprint"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/file"
)

// BundleStoreCache provides a cache of items in a Bundle Store.
// This can be used for various bundle store implementations, including system/platform/workspace.
type BundleStoreCache struct {
	fileListCache    cache.Cache[[]file.Metadata]
	bundleEntryCache cache.Cache[meta.BundleableItem]
	bundleDefCache   cache.Cache[*meta.BundleDef]
}

const (
	defaultExpiry  = time.Duration(12 * time.Hour)
	defaultCleanup = time.Duration(2 * time.Hour)
)

// NewBundleStoreCache creates a cache for items in a Bundle Store.
// This can be used for various bundle store implementations, including system/platform/workspace.
func NewBundleStoreCache(entryExpiration, cleanupFrequency time.Duration) *BundleStoreCache {
	return &BundleStoreCache{
		fileListCache:    cache.NewMemoryCache[[]file.Metadata](entryExpiration, cleanupFrequency),
		bundleEntryCache: cache.NewMemoryCache[meta.BundleableItem](defaultExpiry, defaultCleanup),
		bundleDefCache:   cache.NewMemoryCache[*meta.BundleDef](defaultExpiry, defaultCleanup),
	}
}

func (bsc *BundleStoreCache) GetFileListFromCache(basePath string) ([]file.Metadata, bool) {
	files, err := bsc.fileListCache.Get(basePath)
	if err != nil || files == nil {
		return nil, false
	}
	return files, true
}

func (bsc *BundleStoreCache) AddFileListToCache(basePath string, files []file.Metadata) {
	bsc.fileListCache.Set(basePath, files)
}

func (bsc *BundleStoreCache) getItemCacheKey(namespace, version, bundleGroupName, itemKey string) string {
	return fmt.Sprintf("%s|%s|%s|%s", namespace, version, bundleGroupName, itemKey)
}

func (bsc *BundleStoreCache) getBundleDefCacheKey(namespace, version string) string {
	return fmt.Sprintf("%s|%s", namespace, version)
}

func (bsc *BundleStoreCache) GetItemFromCache(namespace, version, bundleGroupName, key string) (meta.BundleableItem, bool) {
	entry, err := bsc.bundleEntryCache.Get(bsc.getItemCacheKey(namespace, version, bundleGroupName, key))
	if err != nil || entry == nil {
		return nil, false
	}
	return entry, true
}

func (bsc *BundleStoreCache) AddItemToCache(namespace, version, groupName, itemKey string, item meta.BundleableItem) error {
	return bsc.bundleEntryCache.Set(bsc.getItemCacheKey(namespace, version, groupName, itemKey), reprint.This(item).(meta.BundleableItem))
}

func (bsc *BundleStoreCache) InvalidateCacheItem(namespace, version, groupName, itemKey string) error {
	return bsc.bundleEntryCache.Del(bsc.getItemCacheKey(namespace, version, groupName, itemKey))
}

func (bsc *BundleStoreCache) GetBundleDefFromCache(namespace, version string) (*meta.BundleDef, bool) {
	entry, err := bsc.bundleDefCache.Get(bsc.getBundleDefCacheKey(namespace, version))
	if err != nil || entry == nil {
		return nil, false
	}
	return entry, true
}

func (bsc *BundleStoreCache) AddBundleDefToCache(namespace, version string, bundleDef *meta.BundleDef) error {
	return bsc.bundleDefCache.Set(bsc.getBundleDefCacheKey(namespace, version), bundleDef)
}

func (bsc *BundleStoreCache) InvalidateCacheBundleDef(namespace, version string) error {
	return bsc.bundleDefCache.Del(bsc.getBundleDefCacheKey(namespace, version))
}

func (bsc *BundleStoreCache) InvalidateCache() error {
	if err := bsc.invalidateBundleEntryCache(); err != nil {
		return err
	}

	if err := bsc.invalidateFileListCache(); err != nil {
		return err
	}

	if err := bsc.invalidateBundleDefCache(); err != nil {
		return err
	}

	return nil
}

func (bsc *BundleStoreCache) invalidateBundleEntryCache() error {
	return bsc.bundleEntryCache.DeleteAll()
}

func (bsc *BundleStoreCache) invalidateFileListCache() error {
	return bsc.fileListCache.DeleteAll()
}

func (bsc *BundleStoreCache) invalidateBundleDefCache() error {
	return bsc.bundleDefCache.DeleteAll()
}
