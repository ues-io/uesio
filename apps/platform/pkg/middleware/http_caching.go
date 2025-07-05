package middleware

import (
	"net/http"
	"os"
	"time"

	cw "github.com/bigkevmcd/go-cachewrapper"
)

var (
	oneYearCacheOpts = []func(o *cw.CacheOptions){
		cw.Immutable(),
		cw.SharedMaxAge(time.Hour * 24 * 365),
		cw.NoTransform(),
		cw.Private(),
	}
	noCacheOpts = []func(o *cw.CacheOptions){
		cw.NoCache(),
		cw.NoStore(),
		cw.MustRevalidate(),
	}
)

func SetNoCache(w http.ResponseWriter) {
	setCacheHeader(w, noCacheOpts...)
}

// Set1YearCache implements a default caching policy for client-side assets
func Set1YearCache(w http.ResponseWriter) {
	if isHTTPCachingEnabled() {
		setCacheHeader(w, oneYearCacheOpts...)
	} else {
		SetNoCache(w)
	}
}

// With1YearCache implements a default caching policy for client-side assets
func With1YearCache(handler http.Handler) http.Handler {
	// cw.Cached expects an optionFunc but its private.  We can define our
	// own option functions (usingfunc(o *cw.CacheOptions)) and are able
	// to pass those in individually but we can not put them in a slice
	// and then spread to the variadic argument. To simplify, we create a single
	// function to wrap the desired behavior we want so that we can
	// use the same slice of optionFunc's when directly setting header
	// vs in via the handler.
	if isHTTPCachingEnabled() {
		return cw.Cached(handler, oneYearCache())
	} else {
		return cw.Cached(handler, noCache())
	}
}

func WithAccessControlAllowOriginHeader(h http.Handler, origins string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", origins)
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		h.ServeHTTP(w, r)
	})
}

func setCacheHeader(w http.ResponseWriter, opts ...func(o *cw.CacheOptions)) {
	co := cw.CacheOptions{}
	for _, o := range opts {
		o(&co)
	}
	w.Header().Set("Cache-Control", co.String())
}

func oneYearCache() func(o *cw.CacheOptions) {
	return func(co *cw.CacheOptions) {
		for _, o := range oneYearCacheOpts {
			o(co)
		}
	}
}

func noCache() func(o *cw.CacheOptions) {
	return func(co *cw.CacheOptions) {
		for _, o := range noCacheOpts {
			o(co)
		}
	}
}

func isHTTPCachingEnabled() bool {
	return os.Getenv("UESIO_BUILD_VERSION") != "" || os.Getenv("UESIO_FORCE_HTTP_CACHING") == "true"
}
