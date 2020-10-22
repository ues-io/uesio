package controllers

import (
	"net/http"
	"path/filepath"

	"github.com/gorilla/mux"
)

// Fonts is good
func Fonts(w http.ResponseWriter, r *http.Request) {
	filename := mux.Vars(r)["filename"]

	ServeStatic(
		filepath.Join("fonts", filename),
	)(w, r)
}
