package middleware

import (
	"context"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

type sessionContextKey string

const sessionKey sessionContextKey = "session"

func GetSessionFromContext(c context.Context) *sess.Session {
	val := c.Value(sessionKey)
	if val != nil {
		return val.(*sess.Session)
	}
	return nil
}

func GetSession(r *http.Request) *sess.Session {
	return r.Context().Value(sessionKey).(*sess.Session)
}

func SetSession(r *http.Request, s *sess.Session) context.Context {
	ctx := context.WithValue(r.Context(), sessionKey, s)
	// attach the Go context to the session so that we can access the request context from basically anywhere.
	// This was done because it was deemed less invasive than refactoring all of our code to pass a context around,
	// since we already have a Session basically everywhere.
	// Ideally, we would have a context.Context in virtually all of our Go method calls,
	// but I leave that for another day, since it would be very time-consuming to refactor all of our Go method calls.
	s.SetGoContext(ctx)
	return ctx
}
