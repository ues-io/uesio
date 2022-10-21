package cache

import (
	"fmt"
	"os"
	"strconv"

	"github.com/gomodule/redigo/redis"
)

var redisPool *redis.Pool
var redisTTL = strconv.Itoa(60 * 60 * 24)

func init() {
	redisHost := os.Getenv("REDIS_HOST")
	redisPort := os.Getenv("REDIS_PORT")
	redisTTLValue := os.Getenv("REDIS_TTL")

	if redisTTLValue != "" {
		redisTTL = redisTTLValue
	}

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

func GetRedisTTL() string {
	return redisTTL
}

func DeleteKeys(keys []string) error {
	if len(keys) == 0 {
		return nil
	}
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

	conn.Send("HSET", redis.Args{}.Add(key).AddFlat(data)...)
	conn.Send("EXPIRE", key, redisTTL)
	conn.Flush()

	_, err := conn.Receive()
	if err != nil {
		return fmt.Errorf("Error Setting cache value: " + err.Error())
	}

	_, err = conn.Receive()
	if err != nil {
		fmt.Println("Error Setting cache value: " + err.Error())
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
