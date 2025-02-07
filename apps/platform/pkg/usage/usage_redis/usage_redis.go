package usage_redis

import (
	"fmt"
	"log/slog"
	"strconv"

	"github.com/gomodule/redigo/redis"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/usage/usage_common"
)

const MAX_USAGE_PER_RUN = 1000
const KEYS_SET_NAME = "USAGE_KEYS"

type RedisUsageHandler struct{}

func (ruh *RedisUsageHandler) ApplyBatch(session *sess.Session) error {

	conn := cache.GetRedisConn()
	defer func(conn redis.Conn) {
		err := conn.Close()
		if err != nil {
			slog.Error(err.Error())
		}
	}(conn)

	// SPOP gets and removes up to N random members from a set.
	// If these keys are NOT successfully processed, we will need to add them back to the set
	// in order to ensure that a subsequent job processes them.
	keys, err := redis.Strings(conn.Do("SPOP", KEYS_SET_NAME, MAX_USAGE_PER_RUN))
	if err != nil {
		return fmt.Errorf("Error getting usage set members: %w", err)
	}

	if len(keys) == 0 {
		slog.Info("Job completed, no usage events to process")
		return nil
	}

	keyArgs := redis.Args{}.AddFlat(keys)

	values, err := redis.Strings(conn.Do("MGET", keyArgs...))
	if err != nil {
		return fmt.Errorf("Error fetching usage keys: %w", err)
	}

	changes := meta.UsageCollection{}

	for i, key := range keys {
		total, _ := strconv.ParseInt(values[i], 10, 64)
		usageItem := usage_common.GetUsageItem(key, total)
		if usageItem == nil {
			continue
		}
		changes = append(changes, usageItem)
	}

	err = usage_common.SaveBatch(changes, session)
	if err != nil {
		return err
	}

	// Now that we've successfully saved, delete the keys
	_, err = conn.Do("DEL", keyArgs...)
	if err != nil {
		originalError := err
		// Restore the usage keys which we failed to process back to the set
		_, err = conn.Do("SADD", redis.Args{}.Add(KEYS_SET_NAME).AddFlat(keys))
		return fmt.Errorf("Failed to update usage events: %w : %w : %v", originalError, err, len(keys))
	}
	return nil
}

func (ruh *RedisUsageHandler) Set(key string, size int64) error {
	go setRedisUsage(key, size)
	return nil
}

func setRedisUsage(key string, size int64) error {
	conn := cache.GetRedisConn()
	defer conn.Close()

	conn.Send("SADD", KEYS_SET_NAME, key)

	if size != 0 {
		conn.Send("INCRBY", key, size)

	} else {
		conn.Send("INCR", key)
	}

	err := conn.Flush()
	if err != nil {
		return fmt.Errorf("Error Setting cache value: %w", err)
	}
	_, err = conn.Receive()
	if err != nil {
		return fmt.Errorf("Error Setting cache value: %w", err)
	}

	return nil
}
