package bundle

import (
	"fmt"
	"os"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

var doCache bool

var fileListCache cache.Cache[[]string]
var bundleEntryCache cache.Cache[meta.BundleableItem]

func init() {
	doCache = os.Getenv("UESIO_CACHE_SITE_BUNDLES") == "true"
	fileListCache = cache.NewMemoryCache[[]string]()
	bundleEntryCache = cache.NewMemoryCache[meta.BundleableItem]()
}

func GetFileListFromCache(basePath string, conditions meta.BundleConditions) ([]string, bool) {
	if !doCache {
		return nil, false
	}
	files, err := fileListCache.Get(basePath + fmt.Sprint(conditions))
	if err != nil || files == nil {
		return nil, false
	}
	return files, true
}

func AddFileListToCache(basePath string, conditions meta.BundleConditions, files []string) {
	if !doCache {
		return
	}
	fileListCache.Set(basePath+fmt.Sprint(conditions), files)
}

func GetItemFromCache(namespace, version, bundleGroupName, key string) (meta.BundleableItem, bool) {
	if !doCache {
		return nil, false
	}
	entry, err := bundleEntryCache.Get(namespace + version + bundleGroupName + key)
	if err != nil || entry == nil {
		return nil, false
	}
	return entry, true
}

func AddItemToCache(item meta.BundleableItem, namespace, version string) {
	if !doCache {
		return
	}
	bundleEntryCache.Set(namespace+version+item.GetCollectionName()+item.GetKey(), item)
}
