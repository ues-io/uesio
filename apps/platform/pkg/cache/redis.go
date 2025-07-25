package cache

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/gomodule/redigo/redis"
)

var redisPool *redis.Pool

// 1 day
var redisTTLSeconds = 60 * 60 * 24
var existingNamespaces map[string]bool
var namespaceMutex sync.Mutex

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
	namespacedKeys := make([]string, len(keys))
	for i, k := range keys {
		namespacedKeys[i] = namespaced(r.getNamespace(), k)
	}
	return deleteKeys(namespacedKeys)
}

func (r RedisCache[T]) DeleteAll() error {
	// TODO: This may need to change to flushDB if/when we partition in to different databases in redis
	return flushAll()
}

func (r RedisCache[T]) Add(key string, value T) error {
	bytes, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return addString(namespaced(r.getNamespace(), key), string(bytes), int64(r.getExpiration().Seconds()))
}

func (r RedisCache[T]) WithExpiration(expiration time.Duration) RedisCache[T] {
	r.options.Expiration = expiration
	return r
}

func (r RedisCache[T]) WithInitializer(initializer func() T) RedisCache[T] {
	r.options.Initializer = initializer
	return r
}

func addNamespace(namespace string) error {
	if namespace == "" {
		return fmt.Errorf("namespace cannot be empty")
	}

	namespaceMutex.Lock()
	defer namespaceMutex.Unlock()

	if _, exists := existingNamespaces[namespace]; exists {
		return fmt.Errorf("namespace %s already exists", namespace)
	}
	existingNamespaces[namespace] = true
	return nil
}

// NOTE: For now, adding a simple way to obtain the shared redis pool for scenarios where we need a pool direclty and not a cache implementation (e.g., session management)
// TODO: Refactor this to eliminate the "workaround" currently implemented and consider adding ability to have multiple pools or possibly force multiple pools, one for any RedisCaches and one for each other need. Need to think this through.
func RegisterNamespace(namespace string) (*redis.Pool, error) {
	err := addNamespace(namespace)
	if err != nil {
		return nil, err
	}
	return redisPool, nil
}

func NewRedisCache[T any](namespace string) *RedisCache[T] {
	err := addNamespace(namespace)
	if err != nil {
		panic(fmt.Sprintf("unable to create redis cache for namespace %s: %v", namespace, err))
	}
	return &RedisCache[T]{
		&CacheOptions[T]{
			Namespace: namespace,
		},
	}
}

// TODO: Switch to using go-redis instead of Redigo to get a cleaner, type-safe API
// where we don't have to do manual connection management
func init() {

	sessionStorageMethod := os.Getenv("UESIO_SESSION_STORE")
	platformCache := os.Getenv("UESIO_PLATFORM_CACHE")
	usageHandler := os.Getenv("UESIO_USAGE_HANDLER")

	needRedisForSessions := sessionStorageMethod == "redis"
	needRedisForPlatformCache := platformCache == "redis"
	needRedisForUsage := usageHandler == "redis"

	if !needRedisForSessions && !needRedisForPlatformCache && !needRedisForUsage {
		return
	}

	redisHost := os.Getenv("UESIO_REDIS_HOST") // redis will default to localhost
	redisPort := os.Getenv("UESIO_REDIS_PORT")
	redisUser := os.Getenv("UESIO_REDIS_USER")
	redisPassword := os.Getenv("UESIO_REDIS_PASSWORD")
	redisTLS := os.Getenv("UESIO_REDIS_TLS")
	redisTTLSecondsValue := os.Getenv("UESIO_REDIS_TTL")
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

	if redisTLS == "true" {
		options = append(options, redis.DialUseTLS(true))
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
		return fmt.Errorf("error deleting cache keys from bot: %w", err)
	}
	return nil
}

func flushAll() error {
	conn := GetRedisConn()
	defer conn.Close()
	_, err := conn.Do("FLUSHALL")
	if err != nil {
		return fmt.Errorf("error flushing cache from bot: %w", err)
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

func addString(key string, data string, ttlSeconds int64) error {
	conn := GetRedisConn()
	defer conn.Close()
	result, err := redis.String(conn.Do("SET", key, data, "NX", "EX", ttlSeconds))
	if err != nil {
		if err == redis.ErrNil {
			// redis returns nil when NX set and GET not given if key already exists
			return ErrKeyExists
		}
		return err
	}
	if result != "OK" {
		return fmt.Errorf("unexpected result from redis SET: %s", result)
	}
	return nil
}

func getString(key string) (string, error) {
	conn := GetRedisConn()
	defer conn.Close()
	s, err := redis.String(conn.Do("GET", key))
	if err != nil {
		if err == redis.ErrNil {
			return s, ErrKeyNotFound
		}
		return s, err
	}
	return s, nil
}

func namespaced(namespace, key string) string {
	if namespace == "" {
		return key
	}
	return fmt.Sprintf(nsFmt, namespace, key)
}
