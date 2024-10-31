package cache

import (
	"os"
	"time"
)

// This cache can be switched between memory or redis depending on the setup.

type platformCache[T any] struct {
	c       Cache[T]
	options *CacheOptions[T]
}

func getDefaultExpiration() time.Duration {
	return time.Duration(redisTTLSeconds) * time.Second
}

func NewPlatformCache[T any](namespace string, expiration time.Duration) Cache[T] {
	if expiration == 0 {
		expiration = getDefaultExpiration()
	}
	cacheType := os.Getenv("UESIO_PLATFORM_CACHE")
	if cacheType == "memory" {
		return NewMemoryCache[T](expiration, expiration*2)
	}
	return NewRedisCache[T](namespace).WithExpiration(expiration)
}
