package controllers

import (
	"net/http"
	"path/filepath"

	"github.com/gorilla/mux"
)

// ServeComponentPack serves a component pack
func ServeComponentPack(buildMode bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		namespace := vars["namespace"]
		name := vars["name"]

		fileName := name + ".bundle.js"
		if buildMode {
			fileName = name + ".builder.bundle.js"
		}
		// This should use a bundle store just like everything else.
		basePath := filepath.Join("..", "..", "libs", "uesioapps", namespace, "bundle")
		filePath := filepath.Join(basePath, "componentpacks", fileName)
		http.ServeFile(w, r, filePath)
	}
}
