package redisstore

import (
	"os"
	"time"

	"github.com/eko/gocache/lib/v4/store"

	"github.com/thecloudmasters/uesio/pkg/redisclient"
)

var defaultStore *RedisStore

func init() {
	redisTTLValue := os.Getenv("REDIS_TTL")
	defaultTTL, err := time.ParseDuration(redisTTLValue)
	if err != nil {
		defaultTTL = time.Hour * 24
	}
	defaultStore = NewRedis(redisclient.GetRedisClient(), store.WithExpiration(defaultTTL))
}

func GetDefault() *RedisStore {
	return defaultStore
}
