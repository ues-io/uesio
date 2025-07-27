package middleware

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/go-chi/httplog/v3"
	httputil "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

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

func SetError(c context.Context, err error) {
	// TODO: ctlutil.HandleError & ctlutil.HandleTrailingError have direct call to
	// httplog.SetError rather than calling this function due to import cycle issues. Any
	// changes to this method should be synchronized with ctlutil.HandleError & ctlutil.HandleTrailingError
	// until the import cycle issues are resolved.
	httplog.SetError(c, err)
}

func setSession(ctx context.Context, s *sess.Session) {
	setLogSession(ctx, s)
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

func HandleError(ctx context.Context, w http.ResponseWriter, err error) {
	// Set error in context so that it will be included in request logging. Previously,
	// middleware would not log any errors in any circumstance. For now, logging all
	// errors in all request log messages. Once things stabalize and error handling & logging
	// patterns improved, this may be dialed back (e.g. StatusInternalServerError only) if log
	// messages aren't helpful/needed for all error types.
	SetError(ctx, err)
	// delegating to a shared helper that is used by controllers and middleware due to
	// import cycle issues via auth package. Once refactored, controllers can just call
	// a middleware HandleError utility (or similar) that can update context with error
	// and write out the error.
	httputil.HandleError(ctx, w, err)
}
