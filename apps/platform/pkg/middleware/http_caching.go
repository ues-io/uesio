package middleware

import (
	"net/http"
	"time"

	cw "github.com/bigkevmcd/go-cachewrapper"
)

const ONE_YEAR_IN_HOURS = time.Hour * 24 * 365

// With1YearCache implements a default caching policy for client-side assets
func With1YearCache(handler http.Handler) *cw.CacheControl {
	return cw.Cached(handler, cw.Immutable(), cw.SharedMaxAge(ONE_YEAR_IN_HOURS), cw.NoTransform(), cw.Private())
}

func WithAccessControlAllowOriginHeader(h http.Handler, origins string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", origins)
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		h.ServeHTTP(w, r)
	})
}
