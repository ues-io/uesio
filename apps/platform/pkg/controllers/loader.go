package controllers

import (
	"net/http"
	"path/filepath"
)

// Loader is good
func Loader(w http.ResponseWriter, r *http.Request) {
	ServeStatic(
		filepath.Join("platform", "platform.js"),
	)(w, r)
}
