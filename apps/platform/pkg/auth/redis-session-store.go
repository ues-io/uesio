package auth

import (
	"errors"
	"fmt"
	"log/slog"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/cache"
)

type RedisSessionStore struct {
	cacheManager cache.Cache[session.Session]
}

func NewRedisSessionStore() session.Store {
	return &RedisSessionStore{
		cache.NewRedisCache[session.Session]("session").WithInitializer(session.NewSession),
	}
}

// Get is to implement Store.Get().
func (s *RedisSessionStore) Get(id string) session.Session {
	result, err := s.cacheManager.Get(id)
	if err != nil {
		if errors.Is(err, cache.ErrKeyNotFound) {
			return nil
		} else {
			slog.Error(fmt.Sprintf("error getting session for id [%s] from cache: %v", id, err))
			return nil
		}
	}
	return result
}

// Add is to implement Store.Add().
// Will add a session to the memory store and to the filesystem
// for when the server is restarted
func (s *RedisSessionStore) Add(sess session.Session) {
	if err := s.cacheManager.Set(sess.ID(), sess); err != nil {
		slog.Error("error adding session to redis: " + err.Error())
	}
}

// Remove is to implement Store.Remove().
// Will remove it from both the memory store and the FS
func (s *RedisSessionStore) Remove(sess session.Session) {
	if err := s.cacheManager.Del(sess.ID()); err != nil {
		slog.Error("error removing Redis session: " + err.Error())
	}
}

// Close is to implement Store.Close().
func (s *RedisSessionStore) Close() {
	slog.Info("closing Redis session store")
}
