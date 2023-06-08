package localcache

import "sync"

type LocalCache map[string]interface{}

var cache = LocalCache{}
var lock sync.RWMutex

func GetCacheEntry(namespace string, key string) (interface{}, bool) {
	lock.RLock()
	defer lock.RUnlock()
	result := cache[namespacedkey(namespace, key)]
	if result != nil {
		return result, true
	}
	return nil, false
}

func SetCacheEntry(namespace string, key string, cacheEntry interface{}) {
	lock.Lock()
	defer lock.Unlock()
	cache[namespacedkey(namespace, key)] = cacheEntry
}

func RemoveCacheEntry(namespace string, key string) {
	lock.Lock()
	defer lock.Unlock()
	delete(cache, namespacedkey(namespace, key))
}
func namespacedkey(namespace string, key string) string {
	return namespace + ":" + key
}
