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

func namespacedkey(namespace string, key string) string {
	return namespace + ":" + key
}
