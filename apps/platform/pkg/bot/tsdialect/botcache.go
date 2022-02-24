package tsdialect

import (
	"os"
	"strconv"

	"github.com/dop251/goja"
	"github.com/thecloudmasters/uesio/pkg/localcache"
)

var doCache bool

func init() {
	doCache = os.Getenv("UESIO_CACHE_BOT_PROGRAMS") == "true"
}

// GetBotFromCache function
func GetBotFromCache(key string, updatedat int64) (*goja.Program, bool) {
	if !doCache {
		return nil, false
	}
	entry, ok := localcache.GetCacheEntry("bot-program", key+strconv.FormatInt(updatedat, 10))
	if ok {
		return entry.(*goja.Program), ok
	}
	return nil, ok
}

// AddBotToCache function
func AddBotToCache(program *goja.Program, key string, updatedat int64) {
	if !doCache {
		return
	}
	localcache.SetCacheEntry("bot-program", key+strconv.FormatInt(updatedat, 10), program)
}
