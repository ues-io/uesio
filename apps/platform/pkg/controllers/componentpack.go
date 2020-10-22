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
		filePath := filepath.Join(filepath.Join("bundles", namespace, "v0.0.1", "componentpacks", fileName))
		http.ServeFile(w, r, filePath)
	}
}
