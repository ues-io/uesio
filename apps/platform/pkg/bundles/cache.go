package bundles

import (
	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"os"
)

func getFileListFromCache(namespace string, version string, objectName string) ([]string, bool) {
	if os.Getenv("GAE_ENV") == "" {
		// For Local dev, don't use the cache so we can make lots of changes all the time
		return nil, false
	}

	files, ok := localcache.GetCacheEntry("file-list", namespace+version+objectName)
	if ok {
		return files.([]string), ok
	}
	return nil, false
}
func addListToCache(namespace string, version string, objectName string, files []string) {
	localcache.SetCacheEntry("file-list", namespace+version+objectName, files)
}
func getFromCache(namespace, version, bundleGroupName, name string) (metadata.BundleableItem, bool) {
	// If we're not in app engine, do not use the cache
	if os.Getenv("GAE_ENV") == "" {
		// For Local dev, don't use the cache so we can make lots of changes all the time
		return nil, false
	}
	entry, ok := localcache.GetCacheEntry("bundle-entry", namespace+version+bundleGroupName+name)
	if ok {
		return entry.(metadata.BundleableItem), ok
	}
	return nil, ok
}

// AddItemToCache function
func addItemToCache(item metadata.BundleableItem, namespace, version string) {
	localcache.SetCacheEntry("bundle-entry", namespace+version+item.GetCollectionName()+item.GetKey(), item)
}
