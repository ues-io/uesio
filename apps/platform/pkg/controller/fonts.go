package controller

import (
	"net/http"
	"path/filepath"
)

func Fonts(currentWorkingDirectory, routePrefix string, cache bool) http.Handler {
	fontServer := http.FileServer(http.Dir(filepath.Join(currentWorkingDirectory, "fonts")))
	handler := http.StripPrefix(routePrefix, fontServer)
	if cache {
		handler = With1YearCache(handler)
	}
	return handler
}
