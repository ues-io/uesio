package controller

import (
	"net/http"
	"path/filepath"
)

func Vendor(currentWorkingDirectory, routePrefix string) http.Handler {
	fontServer := http.FileServer(http.Dir(filepath.Join(currentWorkingDirectory, "..", "..", "dist")))
	return http.StripPrefix(routePrefix, fontServer)
}
