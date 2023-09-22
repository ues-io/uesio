package redisstore

/**
 * Forked from https://github.com/eko/gocache/blob/master/store/redis/redis.go
 *
 * This has been altered to make the implementations more efficient,
 * particularly with Delete() and Invalidate().
 * Once/if these changes are integrated into the source, we can remove this file.
 */

import (
	"context"
	"fmt"
	"time"

	lib_store "github.com/eko/gocache/lib/v4/store"
	"github.com/redis/go-redis/v9"
)

// RedisClientInterface represents a go-redis/redis client
type RedisClientInterface interface {
	Get(ctx context.Context, key string) *redis.StringCmd
	TTL(ctx context.Context, key string) *redis.DurationCmd
	Expire(ctx context.Context, key string, expiration time.Duration) *redis.BoolCmd
	Set(ctx context.Context, key string, values any, expiration time.Duration) *redis.StatusCmd
	Del(ctx context.Context, keys ...string) *redis.IntCmd
	FlushAll(ctx context.Context) *redis.StatusCmd
	SAdd(ctx context.Context, key string, members ...any) *redis.IntCmd
	SMembers(ctx context.Context, key string) *redis.StringSliceCmd
}

const (
	// RedisType represents the storage type as a string value
	RedisType = "redis"
	// RedisTagPattern represents the tag pattern to be used as a key in specified storage
	RedisTagPattern = "gocache_tag_%s"
)

// RedisStore is a store for Redis
type RedisStore struct {
	client  RedisClientInterface
	options *lib_store.Options
}

// NewRedis creates a new store to Redis instance(s)
func NewRedis(client RedisClientInterface, options ...lib_store.Option) *RedisStore {
	return &RedisStore{
		client:  client,
		options: lib_store.ApplyOptions(options...),
	}
}

// Get returns data stored from a given key
func (s *RedisStore) Get(ctx context.Context, key any) (any, error) {
	object, err := s.client.Get(ctx, key.(string)).Result()
	if err == redis.Nil {
		return nil, lib_store.NotFoundWithCause(err)
	}
	return object, err
}

// GetWithTTL returns data stored from a given key and its corresponding TTL
func (s *RedisStore) GetWithTTL(ctx context.Context, key any) (any, time.Duration, error) {
	object, err := s.client.Get(ctx, key.(string)).Result()
	if err == redis.Nil {
		return nil, 0, lib_store.NotFoundWithCause(err)
	}
	if err != nil {
		return nil, 0, err
	}

	ttl, err := s.client.TTL(ctx, key.(string)).Result()
	if err != nil {
		return nil, 0, err
	}

	return object, ttl, err
}

// Set defines data in Redis for given key identifier
func (s *RedisStore) Set(ctx context.Context, key any, value any, options ...lib_store.Option) error {
	opts := lib_store.ApplyOptionsWithDefault(s.options, options...)

	err := s.client.Set(ctx, key.(string), value, opts.Expiration).Err()
	if err != nil {
		return err
	}

	if tags := opts.Tags; len(tags) > 0 {
		s.setTags(ctx, key, tags)
	}

	return nil
}

func (s *RedisStore) setTags(ctx context.Context, key any, tags []string) {
	for _, tag := range tags {
		tagKey := fmt.Sprintf(RedisTagPattern, tag)
		s.client.SAdd(ctx, tagKey, key.(string))
		s.client.Expire(ctx, tagKey, 720*time.Hour)
	}
}

// Delete removes data from Redis for given key identifier
func (s *RedisStore) Delete(ctx context.Context, keys any) error {
	var err error
	switch val := keys.(type) {
	case []string:
		_, err = s.client.Del(ctx, val...).Result()
	case string:
		_, err = s.client.Del(ctx, val).Result()
	}
	return err
}

// Invalidate invalidates some cache data in Redis for given options
func (s *RedisStore) Invalidate(ctx context.Context, options ...lib_store.InvalidateOption) error {
	opts := lib_store.ApplyInvalidateOptions(options...)

	if tags := opts.Tags; len(tags) > 0 {
		for _, tag := range tags {
			tagKey := fmt.Sprintf(RedisTagPattern, tag)
			cacheKeys, err := s.client.SMembers(ctx, tagKey).Result()
			if err != nil {
				// if we get an error, that almost for sure means that the set may no longer exist,
				// in which case there's nothing more to do
				continue
			}
			if err = s.Delete(ctx, cacheKeys); err != nil {
				continue
			}
			if err = s.Delete(ctx, tagKey); err != nil {
				continue
			}
		}
	}

	return nil
}

// GetType returns the store type
func (s *RedisStore) GetType() string {
	return RedisType
}

// Clear resets all data in the store
func (s *RedisStore) Clear(ctx context.Context) error {
	if err := s.client.FlushAll(ctx).Err(); err != nil {
		return err
	}

	return nil
}
