package controller

import (
	"net/http"
	"path/filepath"
)

func Fonts(currentWorkingDirectory, routePrefix string) http.Handler {
	fontServer := http.FileServer(http.Dir(filepath.Join(currentWorkingDirectory, "fonts")))
	return http.StripPrefix(routePrefix, fontServer)
}
