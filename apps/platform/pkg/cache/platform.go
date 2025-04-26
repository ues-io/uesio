package cache

import (
	"os"
	"time"
)

// This cache can be switched between memory or redis depending on the setup.

func getDefaultExpiration() time.Duration {
	return time.Duration(redisTTLSeconds) * time.Second
}

func NewPlatformCache[T any](namespace string, expiration time.Duration) Cache[T] {
	if expiration == 0 {
		expiration = getDefaultExpiration()
	}
	cacheType := os.Getenv("UESIO_PLATFORM_CACHE")
	switch cacheType {
	case "redis":
		return NewRedisCache[T](namespace).WithExpiration(expiration)
	case "", "memory":
		return NewMemoryCache[T](expiration, expiration*2)
	}
	// TODO: The panic here is not ideal but we currently call NewPlatformCache from
	// init functions which can't handle errors and would only panic anyway.  Need to
	// refactor how we obtain cache instances so that we can properly handle errors
	// returned here OR move the Getenv lookup higher up in startup code of platform
	// so that its value can be validated and we can more gracefully handle invalid
	// values.
	panic("UESIO_PLATFORM_CACHE is an unrecognized value: " + cacheType)
}
