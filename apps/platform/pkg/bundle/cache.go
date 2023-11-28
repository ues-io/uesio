package bundle

import (
	"fmt"
	"time"

	"github.com/qdm12/reprint"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

// BundleStoreCache provides a cache of items in a Bundle Store.
// This can be used for various bundle store implementations, including system/platform/workspace.
type BundleStoreCache struct {
	fileListCache    cache.Cache[[]string]
	bundleEntryCache cache.Cache[meta.BundleableItem]
}

const (
	defaultExpiry  = time.Duration(12 * time.Hour)
	defaultCleanup = time.Duration(2 * time.Hour)
)

// NewBundleStoreCache creates a cache for items in a Bundle Store.
// This can be used for various bundle store implementations, including system/platform/workspace.
func NewBundleStoreCache(entryExpiration, cleanupFrequency time.Duration) *BundleStoreCache {
	return &BundleStoreCache{
		fileListCache:    cache.NewMemoryCache[[]string](entryExpiration, cleanupFrequency),
		bundleEntryCache: cache.NewMemoryCache[meta.BundleableItem](defaultExpiry, defaultCleanup),
	}
}

func (bsc *BundleStoreCache) GetFileListFromCache(basePath string, conditions meta.BundleConditions) ([]string, bool) {
	files, err := bsc.fileListCache.Get(basePath + fmt.Sprint(conditions))
	if err != nil || files == nil {
		return nil, false
	}
	return files, true
}

func (bsc *BundleStoreCache) AddFileListToCache(basePath string, conditions meta.BundleConditions, files []string) {
	bsc.fileListCache.Set(basePath+fmt.Sprint(conditions), files)
}

func (bsc *BundleStoreCache) getItemCacheKey(namespace, version, bundleGroupName, itemKey string) string {
	return fmt.Sprintf("%s|%s|%s|%s", namespace, version, bundleGroupName, itemKey)
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
