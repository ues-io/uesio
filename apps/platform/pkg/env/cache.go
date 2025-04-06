package env

import "os"

var (
	cacheSiteBundles      = os.Getenv("UESIO_CACHE_SITE_BUNDLES") != "false"
	cacheBotPrograms      = os.Getenv("UESIO_CACHE_BOT_PROGRAMS") != "false"
	cacheWorkspaceBundles = os.Getenv("UESIO_CACHE_WORKSPACE_BUNDLES") != "false"
)

func ShouldCacheSiteBundles() bool {
	return cacheSiteBundles
}

func ShouldCacheBotPrograms() bool {
	return cacheBotPrograms
}

func ShouldCacheWorkspaceBundles() bool {
	return cacheWorkspaceBundles
}
