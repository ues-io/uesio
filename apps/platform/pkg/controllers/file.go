package controllers

import (
	"mime"
	"net/http"
	"path/filepath"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// ServeFile serves a file
func ServeFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	session := middlewares.GetSession(r)

	file := metadata.File{
		Name:      name,
		Namespace: namespace,
	}

	err := bundles.Load(&file, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	stream, err := bundles.GetFileStream(&file, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Failed File Download", http.StatusInternalServerError)
		return
	}

	mimeType := mime.TypeByExtension(filepath.Ext(file.FileName))

	respondFile(w, r, mimeType, stream)

}
