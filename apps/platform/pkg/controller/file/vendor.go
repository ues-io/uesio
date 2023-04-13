package file

import (
	"net/http"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Vendor(currentWorkingDirectory, routePrefix string, cache bool) http.Handler {
	fontServer := http.FileServer(http.Dir(filepath.Join(currentWorkingDirectory, "..", "..", "dist")))
	handler := http.StripPrefix(routePrefix, fontServer)
	if cache {
		handler = middleware.With1YearCache(handler)
	}
	return handler
}
