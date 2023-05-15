package middleware

import (
	"net/http"

	"github.com/NYTimes/gziphandler"
	"github.com/thecloudmasters/uesio/pkg/logger"
)

var gzipContentTypesAllowList = []string{
	"application/json",
	"text/json",
	"text/html",
	"application/javascript",
	"text/javascript",
	"text/css",
	"image/vnd.microsoft.icon",
}

func GZip() func(http.Handler) http.Handler {
	// apply gzip encoding for specific content types. Don't bother with PNG/JPEG/WOFF which are already compressed
	gzipWrapper, err := gziphandler.GzipHandlerWithOpts(gziphandler.ContentTypes(gzipContentTypesAllowList))
	if err != nil {
		logger.LogError(err)
		return nil
	}
	return gzipWrapper
}
