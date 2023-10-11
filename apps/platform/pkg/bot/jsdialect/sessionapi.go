package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// SessionAPI and UserAPI expose a limited set of Session information for usage in Bots

type SessionAPI struct {
	session *sess.Session
}

func NewSessionAPI(session *sess.Session) *SessionAPI {
	return &SessionAPI{
		session,
	}
}

func (s *SessionAPI) GetId() string {
	return s.session.GetSessionId()
}
