package cache

import (
	"errors"
	"time"

	// Using go-cache package to get thread-safety, sharding, expiration, and cleanup,
	// while still retaining effectively the simplicity of a map[string]interface{}
	gocache "github.com/patrickmn/go-cache"
)

type memoryCache[T any] struct {
	c *gocache.Cache
}

func NewMemoryCache[T any](expirationTime, purgeTime time.Duration) Cache[T] {
	c := gocache.New(expirationTime, purgeTime)
	return &memoryCache[T]{
		c,
	}
}

func (mc *memoryCache[T]) Get(key string) (T, error) {
	var result T
	val, hasVal := mc.c.Get(key)
	if hasVal {
		return val.(T), nil
	}
	return result, errors.New("key " + key + " not found")
}

func (mc *memoryCache[T]) Set(key string, value T) error {
	mc.c.Set(key, value, 0) // 0 duration = use default expiration
	return nil
}

func (mc *memoryCache[T]) Del(key ...string) error {
	for _, k := range key {
		mc.c.Delete(k)
	}
	return nil
}
