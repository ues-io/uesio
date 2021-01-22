package controller

import (
	"net/http"
	"path/filepath"

	"github.com/gorilla/mux"
)

// Vendor serves files from the dist directory
func Vendor(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, filepath.Join("..", "..", "dist", mux.Vars(r)["filename"]))
}
