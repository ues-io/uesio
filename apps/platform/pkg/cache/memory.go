package cache

import (
	"errors"
	"sync"
)

type MemoryCache[T any] struct {
	cache map[string]T
	lock  sync.RWMutex
}

func NewMemoryCache[T any]() Cache[T] {
	return &MemoryCache[T]{
		map[string]T{},
		sync.RWMutex{},
	}
}

func (c *MemoryCache[T]) Get(key string) (T, error) {
	c.lock.RLock()
	defer c.lock.RUnlock()
	result, hasVal := c.cache[key]
	if hasVal {
		return result, nil
	}
	return result, errors.New("key " + key + " not found")
}

func (c *MemoryCache[T]) Set(key string, value T) error {
	c.lock.Lock()
	defer c.lock.Unlock()
	c.cache[key] = value
	return nil
}

func (c *MemoryCache[T]) Del(key ...string) error {
	c.lock.Lock()
	defer c.lock.Unlock()
	for _, k := range key {
		delete(c.cache, k)
	}
	return nil
}
