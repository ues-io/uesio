package middleware

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/NYTimes/gziphandler"
)

var gzipContentTypesAllowList = []string{
	"application/json",
	"text/html",
	"application/javascript",
	"text/javascript",
	"text/css",
	"image/vnd.microsoft.icon",
}

func GZip(ctx context.Context) func(http.Handler) http.Handler {
	// apply gzip encoding for specific content types. Don't bother with PNG/JPEG/WOFF which are already compressed
	gzipWrapper, err := gziphandler.GzipHandlerWithOpts(gziphandler.ContentTypes(gzipContentTypesAllowList))
	if err != nil {
		slog.ErrorContext(ctx, err.Error())
		return nil
	}
	return gzipWrapper
}
