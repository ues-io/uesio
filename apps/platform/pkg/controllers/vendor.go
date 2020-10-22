package controllers

import (
	"net/http"
	"path/filepath"

	"github.com/gorilla/mux"
)

// Vendor is good
func Vendor(w http.ResponseWriter, r *http.Request) {
	filename := mux.Vars(r)["filename"]

	ServeStatic(
		filepath.Join("..", "..", "dist", filename),
	)(w, r)
}
