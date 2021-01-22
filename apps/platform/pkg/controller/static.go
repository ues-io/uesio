package controller

import (
	"net/http"
)

// ServeStatic serves a static file
func ServeStatic(path string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, path)
	}
}
