package controller

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/logger"
)

const ONE_YEAR_IN_HOURS = time.Hour * 24 * 365

// CacheControl is an http.Handler that sets cache headers.
type CacheControl struct {
	options CacheOptions
	handler http.Handler
}

func With1YearCache(handler http.Handler) *CacheControl {
	return Cached(handler, Immutable(), SharedMaxAge(ONE_YEAR_IN_HOURS), NoTransform(), Private())

}

// Cached returns an http.Handler that sets appropriate Cache headers on
// the outgoing response and passes requests to a wrapped http.Handler.
func Cached(handler http.Handler, opts ...optionFunc) *CacheControl {
	co := CacheOptions{}
	for _, o := range opts {
		o(&co)
	}
	return &CacheControl{
		handler: handler,
		options: co,
	}
}

// ServeHTTP sets the header and passes the request and response to the
// wrapped http.Handler
func (c *CacheControl) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", c.options.String())
	logger.Log("SETTING CACHE CONTROL for "+r.RequestURI, logger.INFO)
	c.handler.ServeHTTP(w, r)
}

// MaxAge configures the maximum-age cache option.
func MaxAge(d time.Duration) optionFunc {
	return func(o *CacheOptions) {
		o.MaxAge = d
	}
}

// NoTransform configures the the no-transform pragma.
func NoTransform() optionFunc {
	return func(o *CacheOptions) {
		o.NoTransform = true
	}
}

// Immutable configures the max-age pragma to be one year in the future.
func Immutable() optionFunc {
	return func(o *CacheOptions) {
		o.Immutable = true
	}
}

// Private configures the private cache option.
func Private() optionFunc {
	return func(o *CacheOptions) {
		o.Private = true
	}
}

// NoCache configures the no-cache pragma.
func NoCache() optionFunc {
	return func(o *CacheOptions) {
		o.NoCache = true
	}
}

// NoStore configures the no-store pragma.
func NoStore() optionFunc {
	return func(o *CacheOptions) {
		o.NoStore = true
	}
}

// MustRevalidate configures the must-revalidate pragma.
func MustRevalidate() optionFunc {
	return func(o *CacheOptions) {
		o.MustRevalidate = true
	}
}

// ProxyRevalidate configures the proxy-revalidate pragma.
func ProxyRevalidate() optionFunc {
	return func(o *CacheOptions) {
		o.ProxyRevalidate = true
	}
}

// SharedMaxAge configures the s-maxage pragma.
func SharedMaxAge(d time.Duration) optionFunc {
	return func(o *CacheOptions) {
		o.SharedMaxAge = d
	}
}

// Config takes a CacheOptions value and replaces options.
func Config(co CacheOptions) optionFunc {
	return func(o *CacheOptions) {
		*o = co
	}
}

// These set the relevant pragmas in the response per
// http://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html
type CacheOptions struct {
	Immutable       bool
	Private         bool
	NoCache         bool
	NoStore         bool
	NoTransform     bool
	MustRevalidate  bool
	ProxyRevalidate bool
	MaxAge          time.Duration
	SharedMaxAge    time.Duration
}

func (o CacheOptions) String() string {
	elements := make([]string, 0)
	if o.Immutable {
		o.MaxAge = ONE_YEAR_IN_HOURS
	}

	if o.Private {
		elements = append(elements, "private")
	}

	if o.NoCache {
		elements = append(elements, "no-cache")
	}

	if o.NoStore {
		elements = append(elements, "no-store")
	}

	if o.NoTransform {
		elements = append(elements, "no-transform")
	}

	if o.MustRevalidate {
		elements = append(elements, "must-revalidate")
	}

	if o.ProxyRevalidate {
		elements = append(elements, "proxy-revalidate")
	}

	if o.MaxAge != 0 {
		elements = append(elements, fmt.Sprintf("max-age=%.0f", o.MaxAge.Seconds()))
	}

	if o.SharedMaxAge != 0 {
		elements = append(elements, fmt.Sprintf("s-maxage=%.0f", o.SharedMaxAge.Seconds()))
	}

	return strings.Join(elements, ", ")
}

type optionFunc func(o *CacheOptions)
