package middleware

import (
	"context"
	"net/http"
)

var requestContextKey = "request"

func GetRequestContext(ctx context.Context) *http.Request {
	val := ctx.Value(requestContextKey)
	if val != nil {
		return val.(*http.Request)
	}
	return nil
}

// AttachRequestToContext adds the current request into the context,
// so that log handlers can inspect the context to see if there is a request
// and use that to log contextual attributes
func AttachRequestToContext(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), requestContextKey, r)))
	})
}
