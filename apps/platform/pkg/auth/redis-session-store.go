package auth

import (
	"fmt"

	"github.com/icza/session"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/logger"
)

// We have to use a cache of bytes here, instead of session.Session,
// because we don't have control of the session.SessionImpl type,
// which needs to implement BinaryMarshaler in order to work

type RedisSessionStore struct {
	cacheManager cache.Cache[session.Session]
}

func NewRedisSessionStore() session.Store {
	cacheManager := cache.NewRedisCache[session.Session]("session").WithInitializer(session.NewSession)
	s := &RedisSessionStore{
		cacheManager,
	}
	return s
}

// Get is to implement Store.Get().
func (s *RedisSessionStore) Get(id string) session.Session {
	result, err := s.cacheManager.Get(id)
	if err != nil || result == nil {
		return nil
	}
	return result
}

// Add is to implement Store.Add().
// Will add a session to the memory store and to the filesystem
// for when the server is restarted
func (s *RedisSessionStore) Add(sess session.Session) {
	err := s.cacheManager.Set(sess.ID(), sess)
	if err != nil {
		logger.LogError(fmt.Errorf("error adding session to redis: %s", err.Error()))
	}
}

// Remove is to implement Store.Remove().
// Will remove it from both the memory store and the FS
func (s *RedisSessionStore) Remove(sess session.Session) {
	err := s.cacheManager.Del(sess.ID())
	if err != nil {
		logger.LogError(fmt.Errorf("error removing Redis session: %s", err.Error()))
	}
}

// Close is to implement Store.Close().
func (s *RedisSessionStore) Close() {
	logger.Info("closing Redis session store")
}
