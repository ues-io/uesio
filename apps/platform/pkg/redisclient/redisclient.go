package redisclient

import (
	"fmt"
	"os"

	"github.com/redis/go-redis/v9"

	"github.com/thecloudmasters/uesio/pkg/goutils"
)

var redisClient *redis.Client

const (
	DefaultRedisPoolSize = 50
	MaxPoolSizeEnvVar    = "REDIS_MAX_POOL_SIZE"
)

func init() {
	poolSizeEnvVar := os.Getenv(MaxPoolSizeEnvVar)
	poolSize, err := goutils.StringToIntWithDefault(poolSizeEnvVar, DefaultRedisPoolSize)
	if err != nil {
		panic(fmt.Errorf("invalid value for %s env var, must be an integer: %s", MaxPoolSizeEnvVar, poolSizeEnvVar))
	}
	redisClient = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PORT")),
		PoolSize: poolSize,
	})
}

func GetRedisClient() *redis.Client {
	return redisClient
}
