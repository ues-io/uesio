package controller

import (
	"net/http"
	"path/filepath"

	"github.com/gorilla/mux"
)

// Fonts serves files from the fonts directory
func Fonts(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, filepath.Join("fonts", mux.Vars(r)["filename"]))
}
