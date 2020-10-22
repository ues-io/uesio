package bundles

import (
	"os"
	"sync"

	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// ItemCache stores metadata by key
type ItemCache map[string]metadata.BundleableItem

// TypeCache stores metadata by type
type TypeCache map[string]ItemCache

// VersionCache stores all metadata by version
type VersionCache map[string]TypeCache

// NamespaceCache stores metadata by namespace
type NamespaceCache map[string]VersionCache
type FileNameCache map[string][]string

var cache = NamespaceCache{}
var fileNameCache = FileNameCache{}

var lock sync.RWMutex
var fileNameLock sync.RWMutex

func getFileListFromCache(namespace string, version string, objectName string) ([]string, bool) {

	fileNameLock.RLock()
	defer fileNameLock.RUnlock()
	if os.Getenv("GAE_ENV") == "" {
		// For Local dev, don't use the cache so we can make lots of changes all the time
		return nil, false
	}
	files, ok := fileNameCache[namespace+version+objectName]
	if ok {
		return files, ok
	}
	return nil, false
}
func addListToCache(namespace string, version string, objectName string, files []string) {
	fileNameLock.Lock()
	defer fileNameLock.Unlock()
	fileNameCache[namespace+version+objectName] = files
}
func getFromCache(namespace, version, bundleGroupName, name string) (metadata.BundleableItem, bool) {
	// If we're not in app engine, do not use the cache
	if os.Getenv("GAE_ENV") == "" {
		// For Local dev, don't use the cache so we can make lots of changes all the time
		return nil, false
	}
	lock.RLock()
	defer lock.RUnlock()
	versionCache, ok := cache[namespace]
	if ok {
		typeCache, ok := versionCache[version]
		if ok {
			itemCache, ok := typeCache[bundleGroupName]
			if ok {
				result, ok := itemCache[name]
				return result, ok
			}
		}
	}
	return nil, false
}

// AddItemToCache function
func addItemToCache(item metadata.BundleableItem, namespace, version string) {
	lock.Lock()
	defer lock.Unlock()
	versionCache, ok := cache[namespace]
	if !ok {
		versionCache = VersionCache{}
		cache[namespace] = versionCache
	}
	typeCache, ok := versionCache[version]
	if !ok {
		typeCache = TypeCache{}
		versionCache[version] = typeCache
	}
	metadataType := item.GetCollectionName()
	itemCache, ok := typeCache[metadataType]
	if !ok {
		itemCache = ItemCache{}
		typeCache[metadataType] = itemCache
	}
	key := item.GetKey()
	itemCache[key] = item
}
