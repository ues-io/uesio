package controller

import (
	"net/http"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Fonts(currentWorkingDirectory, routePrefix string) http.Handler {
	fontServer := http.FileServer(http.Dir(filepath.Join(currentWorkingDirectory, "fonts")))
	handler := http.StripPrefix(routePrefix, fontServer)
	handler = middleware.With1YearCache(handler)
	return handler
}
