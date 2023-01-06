package controller

import (
	"net/http"
	"path/filepath"
)

func Vendor(currentWorkingDirectory, routePrefix string, cache bool) http.Handler {
	fontServer := http.FileServer(http.Dir(filepath.Join(currentWorkingDirectory, "..", "..", "dist")))
	handler := http.StripPrefix(routePrefix, fontServer)
	if cache {
		handler = With1YearCache(handler)
	}
	return handler
}
