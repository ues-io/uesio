package middlewares

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

type sessionContextKey string

const sessionKey sessionContextKey = "session"

// GetSession function
func GetSession(r *http.Request) *sess.Session {
	return r.Context().Value(sessionKey).(*sess.Session)
}
