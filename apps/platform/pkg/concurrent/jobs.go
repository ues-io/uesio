package concurrent

import (
	"sync"

	"github.com/thecloudmasters/uesio/pkg/goutils"
)

// Jobs is a generic, asynchronous job status tracker
// which is safe for concurrent access
type Jobs[T comparable] struct {
	unstarted map[T]struct{}
	pending   map[T]struct{}
	done      map[T]struct{}
	sync.RWMutex
}

func NewJobs[T comparable](jobs []T) *Jobs[T] {
	unstarted := map[T]struct{}{}
	for _, job := range jobs {
		unstarted[job] = struct{}{}
	}
	return &Jobs[T]{
		unstarted: unstarted,
		pending:   map[T]struct{}{},
		done:      map[T]struct{}{},
	}
}

// Unstarted returns a list of all unstarted jobs
func (s *Jobs[T]) Unstarted() []T {
	s.RLock()
	defer s.RUnlock()
	return goutils.MapKeys(s.unstarted)
}

// IsUnstartedOrPending returns true if the provided job is either unstarted or pending
func (s *Jobs[T]) IsUnstartedOrPending(job T) bool {
	s.RLock()
	defer s.RUnlock()
	if _, isUnstarted := s.unstarted[job]; isUnstarted {
		return true
	}
	if _, isPending := s.pending[job]; isPending {
		return true
	}
	return false
}

// HasUnstarted returns true if there are jobs which have not been started yet
func (s *Jobs[T]) HasUnstarted() bool {
	s.RLock()
	defer s.RUnlock()
	return len(s.unstarted) > 0
}

// HasPendingOrUnstarted returns true if there are jobs either unstarted or still pending
func (s *Jobs[T]) HasPendingOrUnstarted() bool {
	s.RLock()
	defer s.RUnlock()
	return len(s.unstarted) > 0 || len(s.pending) > 0
}

// Start moves a job from unstarted to pending status
func (s *Jobs[T]) Start(job T) {
	s.Lock()
	defer s.Unlock()
	delete(s.unstarted, job)
	s.pending[job] = struct{}{}
}

// Finish moves a job from pending to done status
func (s *Jobs[T]) Finish(job T) {
	s.Lock()
	defer s.Unlock()
	delete(s.pending, job)
	s.done[job] = struct{}{}
}
