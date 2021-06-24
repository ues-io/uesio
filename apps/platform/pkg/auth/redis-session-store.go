package auth

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/gomodule/redigo/redis"
	"github.com/icza/session"
)

// RedisSessionStore struct
type RedisSessionStore struct{}

var redisPool *redis.Pool

func init() {
	redisHost := os.Getenv("REDISHOST")
	redisPort := os.Getenv("REDISPORT")
	redisAddr := fmt.Sprintf("%s:%s", redisHost, redisPort)

	const maxConnections = 10
	redisPool = &redis.Pool{
		MaxIdle: maxConnections,
		Dial:    func() (redis.Conn, error) { return redis.Dial("tcp", redisAddr) },
	}
}

func getSessionKey(id string) string {
	return "session" + id
}

// NewRedisSessionStore func
func NewRedisSessionStore() session.Store {
	s := &RedisSessionStore{}
	return s
}

// Get is to implement Store.Get().
// If the session is not already in the in-memory store
// it will attempt to fetch it from the filesystem.
func (s *RedisSessionStore) Get(id string) session.Session {
	fmt.Println("Getting Redis Session: " + id)
	conn := redisPool.Get()
	defer conn.Close()
	value, err := redis.String(conn.Do("GET", getSessionKey(id)))
	if err != nil {
		fmt.Println("Error Getting session: " + id)
	}
	newSess := session.NewSession()
	err = json.Unmarshal([]byte(value), &newSess)
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
	fmt.Println("Adding Redis Session: " + sess.ID())
	conn := redisPool.Get()
	defer conn.Close()
	byteSlice, _ := json.Marshal(sess)
	_, err := conn.Do("SET", getSessionKey(sess.ID()), string(byteSlice))
	if err != nil {
		fmt.Println("Error Adding session: " + err.Error())
	}
}

// Remove is to implement Store.Remove().
// Will remove it from both the memory store and the FS
func (s *RedisSessionStore) Remove(sess session.Session) {
	fmt.Println("Removing Redis Session: " + sess.ID())
	conn := redisPool.Get()
	defer conn.Close()
	_, err := conn.Do("DEL", getSessionKey(sess.ID()))
	if err != nil {
		fmt.Println("Error Deleting session: " + err.Error())
	}
}

// Close is to implement Store.Close().
func (s *RedisSessionStore) Close() {
	fmt.Println("Closing Redis Session")
}
