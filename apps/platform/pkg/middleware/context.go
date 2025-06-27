package middleware

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

type sessionContextKey string

const sessionKey sessionContextKey = "session"

func GetSessionFromContext(c context.Context) *sess.Session {
	if logData := getLogData(c); logData != nil {
		return logData.GetSession()
	}
	slog.WarnContext(c, "unable to get log session, no log data in context")
	return nil
}

func GetSession(r *http.Request) *sess.Session {
	return GetSessionFromContext(r.Context())
}

func setSession(ctx context.Context, s *sess.Session) {
	setLogSession(ctx, s)
	// attach the Go context to the session so that we can access the request context from basically anywhere.
	// This was done because it was deemed less invasive than refactoring all of our code to pass a context around,
	// since we already have a Session basically everywhere.
	// Ideally, we would have a context.Context in virtually all of our Go method calls,
	// but I leave that for another day, since it would be very time-consuming to refactor all of our Go method calls.
	s.SetGoContext(ctx)
}

// Sets session data on logData for the current context that can be accessed by middleware
func setLogSession(ctx context.Context, session *sess.Session) {
	if logData := getLogData(ctx); logData != nil {
		logData.SetSession(session)
		return
	}
	slog.WarnContext(ctx, "unable to set log session, no log data in context")
}

// Retrieves the logData from the context
// Depending on the context (e.g., from the request, context.Background(), etc.), it may or may not be present
func getLogData(ctx context.Context) *logData {
	ld, _ := ctx.Value(logDataContextKey{}).(*logData)
	return ld
}
