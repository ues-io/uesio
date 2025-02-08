package file

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

var (
	staticAssetsPath = ""
	staticAssetsHost = ""
)

func init() {
	// By default, assets will be served from the container / local filesystem,
	// but optionally they can be served from a different host, e.g. a CDN
	staticAssetsHost = os.Getenv("UESIO_STATIC_ASSETS_HOST")
}

func SetAssetsPath(path string) {
	staticAssetsPath = path
}

func GetAssetsPath() string {
	return staticAssetsPath
}

func GetAssetsHost() string {
	return staticAssetsHost
}

func Static(currentWorkingDirectory, routePrefix string, cache bool) http.Handler {
	fileServer := http.FileServer(http.Dir(filepath.Join(currentWorkingDirectory, "..", "..", "dist")))
	handler := http.StripPrefix(routePrefix, fileServer)
	if staticAssetsHost != "" {
		handler = middleware.WithAccessControlAllowOriginHeader(handler, "*")
	}
	if cache && !env.InDevMode() {
		handler = middleware.With1YearCache(handler)
	}
	return handler
}
