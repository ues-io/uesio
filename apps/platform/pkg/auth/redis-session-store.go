package auth

import (
	"fmt"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/cache"
)

type RedisSessionStore struct{}

func getSessionKey(id string) string {
	return "session:" + id
}

func NewRedisSessionStore() session.Store {
	s := &RedisSessionStore{}
	return s
}

// Get is to implement Store.Get().
// If the session is not already in the in-memory store
// it will attempt to fetch it from the filesystem.
func (s *RedisSessionStore) Get(id string) session.Session {
	newSess := session.NewSession()
	err := cache.Get(getSessionKey(id), &newSess)
	if err != nil {
		fmt.Println(err)
		return nil
	}
	return newSess
}

// Add is to implement Store.Add().
// Will add a session to the memory store and to the filesystem
// for when the server is restarted
func (s *RedisSessionStore) Add(sess session.Session) {
	err := cache.Set(getSessionKey(sess.ID()), sess)
	if err != nil {
		fmt.Println("Error Adding session: " + err.Error())
	}
}

// Remove is to implement Store.Remove().
// Will remove it from both the memory store and the FS
func (s *RedisSessionStore) Remove(sess session.Session) {
	fmt.Println("Removing Redis Session: " + sess.ID())
	err := cache.DeleteKeys([]string{getSessionKey(sess.ID())})
	if err != nil {
		fmt.Println("Error Deleting session: " + err.Error())
	}
}

// Close is to implement Store.Close().
func (s *RedisSessionStore) Close() {
	fmt.Println("Closing Redis Session")
}
