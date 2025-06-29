package ctlutil

import (
	"context"
	"net/http"

	"github.com/go-chi/httplog/v3"
	httputil "github.com/thecloudmasters/uesio/pkg/http"
)

// HandleError is a utility for returning an appropriate HTTP response code and error message
// based on a Go error, which is aware of the different Uesio exception classes defined
// in the types/exceptions package.
// This should be used in any error handling scenario within controllers, e.g.
//
//	if err := someCall(); err != nil {
//	   HandleError(w, err)
//	   return
//	}
//
// Deprecated: Use HandleErrorContext instead
// TODO: Update calls to HandleError to use HandleErrorContext instead
func HandleError(w http.ResponseWriter, err error) {
	HandleErrorContext(context.Background(), w, err)
}

// HandleErrorContext is a utility for returning an appropriate HTTP response code and error message
// based on a Go error, which is aware of the different Uesio exception classes defined
// in the types/exceptions package.
// This should be used in any error handling scenario within controllers, e.g.
//
//	if err := someCall(); err != nil {
//	   HandleErrorContext(w, err)
//	   return
//	}
func HandleErrorContext(ctx context.Context, w http.ResponseWriter, err error) {
	// Set error in context so that it will be included in request logging. Previously,
	// only StatusInternalServerError were explicitly logged (separate from request log)
	// but expanding to include all error information and rather than log directly
	// include it in request log messages. Once things stabalize and error handling & logging
	// patterns improved, this may be dialed back if log messages aren't helpful/needed for
	// all error types.
	// TODO: Need to use httplog directly here instead of having it within httputil.HandleError
	// to avoid import cycle error. Refactor to eliminate the import cycle error, include
	// middleware.SetError in the util HandleError and call directly. In meantime, this should
	// be kept in sync with middleware.SetError.
	httplog.SetError(ctx, err)
	// delegating to a shared helper that is used by controllers and middleware due to
	// import cycle issues via auth package. Once refactored, controllers can just call
	// a middleware HandleError utility (or similar) that can update context with error and
	// write out the error.
	httputil.HandleError(ctx, w, err)
}

func HandleTrailingError(w http.ResponseWriter, err error) {
	HandleTrailingErrorContext(context.Background(), w, err)
}

func HandleTrailingErrorContext(ctx context.Context, w http.ResponseWriter, err error) {
	// Set error in context so that it will be included in request logging. Previously,
	// only StatusInternalServerError were explicitly logged (separate from request log)
	// but expanding to include all error information and rather than log directly
	// include it in request log messages. Once things stabalize and error handling & logging
	// patterns improved, this may be dialed back if log messages aren't helpful/needed for
	// all error types.
	// TODO: Need to use httplog directly here instead of having it within httputil.HandleError
	// to avoid import cycle error. Refactor to eliminate the import cycle error, include
	// middleware.SetError in the util HandleError and call directly. In meantime, this should
	// be kept in sync with middleware.SetError.
	httplog.SetError(ctx, err)
	// delegating to a shared helper that is used by controllers and middleware due to
	// import cycle issues via auth package. Once refactored, controllers can just call
	// a middleware HandleError utility (or similar) that can update context with error and
	// write out the error.
	httputil.HandleTrailingError(ctx, w, err)
}

func AddTrailingStatus(w http.ResponseWriter) {
	AddTrailingStatusContext(context.Background(), w)
}

func AddTrailingStatusContext(ctx context.Context, w http.ResponseWriter) {
	httputil.AddTrailingStatus(ctx, w)
}
