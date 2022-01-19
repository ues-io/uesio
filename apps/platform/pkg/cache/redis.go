package cache

import (
	"fmt"
	"os"

	"github.com/gomodule/redigo/redis"
)

var redisPool *redis.Pool

func init() {
	redisHost := os.Getenv("REDISHOST")
	redisPort := os.Getenv("REDISPORT")
	redisAddr := fmt.Sprintf("%s:%s", redisHost, redisPort)

	const maxConnections = 10
	redisPool = &redis.Pool{
		MaxIdle: maxConnections,
		Dial:    func() (redis.Conn, error) { return redis.Dial("tcp", redisAddr) },
	}
}

func GetRedisConn() redis.Conn {
	return redisPool.Get()
}
