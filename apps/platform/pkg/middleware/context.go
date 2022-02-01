package middleware

import (
	"context"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

type sessionContextKey string

const sessionKey sessionContextKey = "session"

func GetSession(r *http.Request) *sess.Session {
	return r.Context().Value(sessionKey).(*sess.Session)
}

func SetSession(r *http.Request, s *sess.Session) context.Context {
	return context.WithValue(r.Context(), sessionKey, s)
}
