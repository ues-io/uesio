package file

import (
	"crypto/md5"
	"encoding/hex"
	"net/http"
	"os"
	"path/filepath"
	"time"

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

// Creates a time-base hash to use inplace of the build version.
// (For Development Mode Only)
func getTimeHash() string {
	timeStr := time.Now().UTC().String()
	hash := md5.Sum([]byte(timeStr))
	return hex.EncodeToString(hash[:])[:8] + ".0000.0"
}

func Static() http.Handler {
	// If we have UESIO_BUILD_VERSION, append that to the prefixes to enable us to have versioned assets
	version := os.Getenv("UESIO_BUILD_VERSION")
	forceHTTPCaching := os.Getenv("UESIO_FORCE_HTTP_CACHING") == "true"
	staticPrefix := "/static"

	// If we don't have a UESIO_BUILD_VERSION, but we want to force http caching, create
	// a fake version string based off of the current time.
	if version == "" && forceHTTPCaching {
		version = getTimeHash()
	}

	if version != "" {
		versionedPath := "/" + version
		SetAssetsPath(versionedPath)
		staticPrefix = staticPrefix + versionedPath
	}

	fileServer := http.FileServer(http.Dir(filepath.Join("..", "..", "dist")))
	handler := http.StripPrefix(staticPrefix, fileServer)
	if staticAssetsHost != "" {
		handler = middleware.WithAccessControlAllowOriginHeader(handler, "*")
	}

	handler = middleware.With1YearCache(handler)

	return handler
}
