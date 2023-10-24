package auth

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"sync"

	"github.com/icza/session"
)

// FSSessionStore struct
type FSSessionStore struct {
	memoryStore session.Store // An in memory store we use for faster retrieval
	mux         *sync.RWMutex // mutex to synchronize access to FS
}

// NewFSSessionStore func
func NewFSSessionStore() session.Store {
	s := &FSSessionStore{
		memoryStore: session.NewInMemStore(),
		mux:         &sync.RWMutex{},
	}
	return s
}

// Get is to implement Store.Get().
// If the session is not already in the in-memory store
// it will attempt to fetch it from the filesystem.
func (s *FSSessionStore) Get(id string) session.Session {
	sess := s.memoryStore.Get(id)
	if sess == nil {
		slog.Info("checking in FS for the session: " + id)
		// We want to make sure we do not conflict with other adds, etc.
		s.mux.RLock()
		defer s.mux.RUnlock()

		filePath := filepath.Join("sessions", id)
		file, err := os.OpenFile(filePath, os.O_RDWR, 0644)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		defer file.Close()
		jsonContent, err := io.ReadAll(file)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		newSess := session.NewSession()
		err = json.Unmarshal(jsonContent, &newSess)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		s.memoryStore.Add(newSess)
		sess = newSess
	}
	return sess
}

// Add is to implement Store.Add().
// Will add a session to the memory store and to the filesystem
// for when the server is restarted
func (s *FSSessionStore) Add(sess session.Session) {

	slog.Info("Adding new session to FS: " + sess.ID())
	byteSlice, _ := json.Marshal(sess)
	sessDir := "sessions"
	filePath := filepath.Join(sessDir, sess.ID())
	s.mux.Lock()
	defer s.mux.Unlock()
	// Create the sessions directory if it does not exist
	if _, err := os.Stat(sessDir); os.IsNotExist(err) {
		err := os.Mkdir(sessDir, 0744)
		if err != nil {
			fmt.Println(err)
		}
	}
	err := os.WriteFile(filePath, byteSlice, 0644)
	if err != nil {
		fmt.Println(err)
	}
	s.memoryStore.Add(sess)
}

// Remove is to implement Store.Remove().
// Will remove it from both the memory store and the FS
func (s *FSSessionStore) Remove(sess session.Session) {
	filePath := filepath.Join("sessions", sess.ID())
	s.mux.Lock()
	defer s.mux.Unlock()
	err := os.Remove(filePath)
	if err != nil {
		fmt.Println(err)
	}
	s.memoryStore.Remove(sess)
}

// Close is to implement Store.Close().
func (s *FSSessionStore) Close() {
	s.memoryStore.Close()
	//TODO:: Wipe FS?
}
