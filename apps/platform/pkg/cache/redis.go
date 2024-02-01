package cache

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"time"

	"github.com/gomodule/redigo/redis"
)

var redisPool *redis.Pool

// 1 day
var redisTTLSeconds = 60 * 60 * 24
var existingNamespaces map[string]bool

const nsFmt = "%s:%s"

// RedisCache provides a type-safe Cache implementation
// where cached data is stored in Redis with a namespaced key prefix,
// with an optional key expiration (defaults to 1 day)
type RedisCache[T any] struct {
	options *CacheOptions[T]
}

func (r RedisCache[T]) Get(key string) (T, error) {
	var result T
	if r.options.Initializer != nil {
		result = r.options.Initializer()
	}
	dataString, err := getString(namespaced(r.getNamespace(), key))
	if err != nil {
		return result, err
	}
	if err = json.Unmarshal([]byte(dataString), &result); err != nil {
		return result, err
	}
	return result, nil
}

func (r RedisCache[T]) getNamespace() string {
	if r.options == nil {
		return ""
	}
	return r.options.Namespace
}

func (r RedisCache[T]) getExpiration() time.Duration {
	if r.options == nil || r.options.Expiration == 0 {
		return getDefaultRedisExpiration()
	}
	return r.options.Expiration
}

func (r RedisCache[T]) Set(key string, value T) error {
	bytes, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return setString(namespaced(r.getNamespace(), key), string(bytes), int64(r.getExpiration().Seconds()))
}

func (r RedisCache[T]) Del(keys ...string) error {
	namespacedKeys := make([]string, len(keys), len(keys))
	for i, k := range keys {
		namespacedKeys[i] = namespaced(r.getNamespace(), k)
	}
	return deleteKeys(namespacedKeys)
}

func (r RedisCache[T]) WithExpiration(expiration time.Duration) RedisCache[T] {
	r.options.Expiration = expiration
	return r
}

func (r RedisCache[T]) WithInitializer(initializer func() T) RedisCache[T] {
	r.options.Initializer = initializer
	return r
}

func NewRedisCache[T any](namespace string) *RedisCache[T] {
	_, exists := existingNamespaces[namespace]
	if exists {
		slog.Error(fmt.Sprintf("cannot create a cache for namespace %s, one already exists", namespace))
		return nil
	}
	existingNamespaces[namespace] = true
	return &RedisCache[T]{
		&CacheOptions[T]{
			Namespace: namespace,
		},
	}
}

// TODO: Switch to using go-redis instead of Redigo to get a cleaner, type-safe API
// where we don't have to do manual connection management
func init() {
	redisHost := os.Getenv("REDIS_HOST")
	redisPort := os.Getenv("REDIS_PORT")
	redisUser := os.Getenv("REDIS_USER")
	redisPassword := os.Getenv("REDIS_PASSWORD")
	redisTTLSecondsValue := os.Getenv("REDIS_TTL")
	if redisPort == "" {
		redisPort = "6379"
	}

	if redisTTLSecondsValue != "" {
		if intVal, err := strconv.Atoi(redisTTLSecondsValue); err != nil {
			redisTTLSeconds = intVal
		}
	}

	redisAddr := fmt.Sprintf("%s:%s", redisHost, redisPort)

	options := []redis.DialOption{}

	if redisUser != "" {
		options = append(options, redis.DialUsername(redisUser))
	}

	if redisPassword != "" {
		options = append(options, redis.DialPassword(redisPassword))
	}

	const maxConnections = 10
	redisPool = &redis.Pool{
		MaxIdle: maxConnections,
		Dial: func() (redis.Conn, error) {
			return redis.Dial("tcp", redisAddr, options...)
		},
	}

	existingNamespaces = map[string]bool{}
}

func getDefaultRedisExpiration() time.Duration {
	return time.Duration(redisTTLSeconds) * time.Second
}

func GetRedisConn() redis.Conn {
	return redisPool.Get()
}

func deleteKeys(keys []string) error {
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

func setString(key string, data string, ttlSeconds int64) error {
	conn := GetRedisConn()
	defer conn.Close()
	_, err := conn.Do("SET", key, data, "EX", ttlSeconds)
	if err != nil {
		return err
	}
	return nil
}

func getString(key string) (string, error) {
	conn := GetRedisConn()
	defer conn.Close()
	return redis.String(conn.Do("GET", key))
}

func namespaced(namespace, key string) string {
	if namespace == "" {
		return key
	}
	return fmt.Sprintf(nsFmt, namespace, key)
}
