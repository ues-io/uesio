package middleware

import (
	"compress/gzip"
	"io"
	"net/http"
	"strings"
)

// Implements http.ResponseWriter
type gzipResponseWriter struct {
	ResponseWriter http.ResponseWriter
	Writer         io.Writer
}

// Header returns the header map that will be sent by WriteHeader.
func (gzrw gzipResponseWriter) Header() http.Header {
	return gzrw.ResponseWriter.Header()
}

// Write writes the data to the connection as part of an HTTP reply.
func (gzrw gzipResponseWriter) Write(bytes []byte) (int, error) {
	return gzrw.Writer.Write(bytes)
}

// WriteHeader sends an HTTP response header with the provided
// status code.
func (gzrw gzipResponseWriter) WriteHeader(statusCode int) {
	gzrw.ResponseWriter.WriteHeader(statusCode)
}

// GZipHandler is a middleware handler that compresses with gzip, if gzip is included in the accept-encoding
func GZipHandler(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			h.ServeHTTP(w, r)
			return
		}
		w.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(w)
		defer gz.Close()
		h.ServeHTTP(gzipResponseWriter{ResponseWriter: w, Writer: gz}, r)
	})
}
