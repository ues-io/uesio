package cache

import "time"

type Cache[T any] interface {
	Get(key string) (T, error)
	Set(key string, value T) error
	Del(keys ...string) error
}

type CacheOptions[T any] struct {
	// Initializer provides a custom function to run if needed
	// when unmarshalling a value of the type from the cache.
	Initializer func() T
	// Expiration defines the lifetime to use for entries in this cache,
	// after which entries should be removed
	Expiration time.Duration
	// Namespace allows for the cache implementation to isolate keys
	// by domain, to facilitate sharding and to avoid key collisions
	Namespace string
}
