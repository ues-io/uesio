package cache

import (
	"fmt"
	"os"

	"github.com/gomodule/redigo/redis"
)

var redisPool *redis.Pool

func init() {
	redisHost := os.Getenv("REDIS_HOST")
	redisPort := os.Getenv("REDIS_PORT")
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

func DeleteKeys(keys []string) error {
	conn := GetRedisConn()
	defer conn.Close()
	_, err := conn.Do("DEL", redis.Args{}.AddFlat(keys)...)
	if err != nil {
		return fmt.Errorf("Error deleting cache keys from bot: " + err.Error())
	}
	return nil
}

func SetHash(key string, data map[string]string) error {
	conn := GetRedisConn()
	defer conn.Close()
	_, err := conn.Do("HSET", redis.Args{}.Add(key).AddFlat(data)...)
	if err != nil {
		return fmt.Errorf("Error Setting cache value: " + err.Error())
	}
	return nil
}

func GetHash(key string) (map[string]string, error) {
	conn := GetRedisConn()
	defer conn.Close()
	result, err := redis.StringMap(conn.Do("HGETALL", key))
	if err != nil {
		return nil, err
	}
	if len(result) == 0 {
		return nil, nil
	}
	return result, nil
}

func GetUserKey(userid, siteid string) string {
	return fmt.Sprintf("user:%s:%s", userid, siteid)
}

func GetHostKey(domainType, domainValue string) string {
	return fmt.Sprintf("host:%s:%s", domainType, domainValue)
}
