package cache

type Cache[T any] interface {
	Get(key string) (T, error)
	Set(key string, value T) error
	Del(keys ...string) error
}
