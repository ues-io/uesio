package cache

import (
	"encoding/json"
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

func Set(key string, data interface{}) error {
	bytes, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return SetString(key, string(bytes))
}

func SetString(key string, data string) error {
	conn := GetRedisConn()
	defer conn.Close()
	_, err := conn.Do("SET", key, data, "EX", redisTTL)
	if err != nil {
		return err
	}
	return nil
}

func GetString(key string) (string, error) {
	conn := GetRedisConn()
	defer conn.Close()
	return redis.String(conn.Do("GET", key))
}

func Get(key string, data interface{}) error {
	//start := time.Now()
	dataString, err := GetString(key)
	if err != nil {
		return err
	}
	//fmt.Printf("REDIS GET %v %v\n", key, time.Since(start))
	return json.Unmarshal([]byte(dataString), data)
}

// We made a change to user data cached in Redis in 1/2023 which required modifying the key
// so that the previous cache data would be ignored, hence the use of "v2" here.
// Once this change is deployed, we can absolutely remove the ":v2" from the key
func GetUserKey(userid, siteid string) string {
	return fmt.Sprintf("user:v2:%s:%s", userid, siteid)
}

func GetHostKey(domainType, domainValue string) string {
	return fmt.Sprintf("host:%s:%s", domainType, domainValue)
}

func GetLicenseKey(namespace string) string {
	return fmt.Sprintf("license:%s", namespace)
}

const nsFmt = "%s:%s"

func namespaced(namespace, key string) string {
	return fmt.Sprintf(nsFmt, namespace, key)
}

type RedisCache[T any] struct {
	namespace string
}

func (r RedisCache[T]) Get(key string) (T, error) {
	var result T
	dataString, err := GetString(namespaced(r.namespace, key))
	if err != nil {
		return result, err
	}
	if err = json.Unmarshal([]byte(dataString), result); err != nil {
		return result, err
	}
	return result, nil
}

func (r RedisCache[T]) Set(key string, value T) error {
	bytes, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return SetString(namespaced(r.namespace, key), string(bytes))
}

func (r RedisCache[T]) Del(keys ...string) error {
	namespacedKeys := make([]string, len(keys), len(keys))
	for i, k := range keys {
		namespacedKeys[i] = namespaced(r.namespace, k)
	}
	return DeleteKeys(namespacedKeys)
}

func NewRedisCache[T any](namespace string) Cache[T] {
	return RedisCache[T]{
		namespace,
	}
}
