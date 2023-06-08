package bundle

import (
	"fmt"
	"os"

	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

var doCache bool

func init() {
	doCache = os.Getenv("UESIO_CACHE_SITE_BUNDLES") == "true"
}

func GetFileListFromCache(basePath string, conditions meta.BundleConditions) ([]string, bool) {
	if !doCache {
		return nil, false
	}
	files, ok := localcache.GetCacheEntry("file-list", basePath+fmt.Sprint(conditions))
	if ok {
		return files.([]string), ok
	}
	return nil, false
}

func AddFileListToCache(basePath string, conditions meta.BundleConditions, files []string) {
	if !doCache {
		return
	}
	localcache.SetCacheEntry("file-list", basePath+fmt.Sprint(conditions), files)
}

func GetItemFromCache(namespace, version, bundleGroupName, key string) (meta.BundleableItem, bool) {
	if !doCache {
		return nil, false
	}
	entry, ok := localcache.GetCacheEntry("bundle-entry", namespace+version+bundleGroupName+key)
	if ok {
		return entry.(meta.BundleableItem), ok
	}
	return nil, ok
}

func AddItemToCache(item meta.BundleableItem, namespace, version string) {
	if !doCache {
		return
	}
	localcache.SetCacheEntry("bundle-entry", namespace+version+item.GetCollectionName()+item.GetKey(), item)
}
