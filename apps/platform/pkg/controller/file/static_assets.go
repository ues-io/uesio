package file

import (
	"net/http"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/middleware"
)

var assetsPath = ""

func SetAssetsPath(path string) {
	assetsPath = path
}

func GetAssetsPath() string {
	return assetsPath
}

func Static(currentWorkingDirectory, routePrefix string, cache bool) http.Handler {
	fontServer := http.FileServer(http.Dir(filepath.Join(currentWorkingDirectory, "..", "..", "dist")))
	handler := http.StripPrefix(routePrefix, fontServer)
	if cache {
		handler = middleware.With1YearCache(handler)
	}
	return handler
}
