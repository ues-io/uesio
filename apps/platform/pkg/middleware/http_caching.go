package middleware

import (
	"net/http"
	"time"

	cw "github.com/bigkevmcd/go-cachewrapper"
)

const OneYearInHours = time.Hour * 24 * 365

// With1YearCache implements a default caching policy for client-side assets
func With1YearCache(handler http.Handler) *cw.CacheControl {
	return cw.Cached(handler, cw.Immutable(), cw.SharedMaxAge(OneYearInHours), cw.NoTransform(), cw.Private())
}
