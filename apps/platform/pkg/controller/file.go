package controller

import (
	"mime"
	"net/http"
	"path/filepath"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

// ServeFile serves a file
func ServeFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	session := middleware.GetSession(r)

	file := meta.File{
		Name:      name,
		Namespace: namespace,
	}

	err := bundle.Load(&file, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	stream, err := bundle.GetFileStream(&file, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Failed File Download", http.StatusInternalServerError)
		return
	}

	mimeType := mime.TypeByExtension(filepath.Ext(file.FileName))

	respondFile(w, r, mimeType, stream)

}
