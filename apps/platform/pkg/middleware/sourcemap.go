package middleware

import (
	"github.com/thecloudmasters/uesio/pkg/config"
	"net/http"
	"strings"
)

// SourceMapHandler is a http.Handler that informs the browser of the path
// where a JS file's source map is located
type SourceMapHandler struct {
	handler http.Handler
}

// WithSourceMapIfNeeded Returns a http.Handler that sets the SourceMap header for a file
func WithSourceMapIfNeeded(handler http.Handler) *SourceMapHandler {
	return &SourceMapHandler{
		handler: handler,
	}
}

// ServeHTTP sets the header and passes the request and response to the
// wrapped http.Handler
func (h *SourceMapHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	AddSourceMapHeaderIfNecessary(w, r)
	h.handler.ServeHTTP(w, r)
}

func AddSourceMapHeaderIfNecessary(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, ".js") {
		// Determine if this is a file that we should / want to provide a SourceMap for.
		// For now, do this ONLY IF BOTH:
		// (A) The file is one of the following:
		// 		- uesio.js
		// 		- runtime.js (i.e. a Component Pack's JS)
		// (B) we are either in UESIO_DEV mode, OR we are in workspace mode
		needsSourceMap := false
		if config.InDevMode() {
			if strings.HasSuffix(r.URL.Path, "uesio.js") || strings.HasSuffix(r.URL.Path, "runtime.js") {
				needsSourceMap = true
			}
		} else if strings.HasSuffix(r.URL.Path, "runtime.js") && strings.Contains(r.URL.Path, "/workspace/") {
			// Only serve the source map if we are in workspace mode
			needsSourceMap = true
		}

		if needsSourceMap {
			w.Header().Set("SourceMap", r.URL.Path+".map")
		}
	}
}
