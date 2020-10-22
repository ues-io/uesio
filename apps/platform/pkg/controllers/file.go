package controllers

import (
	"io"
	"net/http"
	"path/filepath"

	"github.com/gorilla/mux"
	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// ServeFile serves a file
func ServeFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	site := r.Context().Value(middlewares.SiteKey).(*metadata.Site)
	sess := r.Context().Value(middlewares.SessionKey).(*session.Session)

	file := metadata.File{
		Name:      name,
		Namespace: namespace,
	}

	err := datasource.LoadMetadataItem(&file, site, sess)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	if file.Workspace == "" {
		// The file we're looking for is in a bundle so we can get it by url.
		filePath := filepath.Join(filepath.Join("bundles", namespace, "v0.0.1", "files", file.FileName))
		http.ServeFile(w, r, filePath)
		return
	}

	fileStream, mimeType, err := filesource.Download(file.Content, site, sess)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Failed Download", http.StatusInternalServerError)
		return
	}

	defer fileStream.Close()

	w.Header().Set("content-type", mimeType)

	_, err = io.Copy(w, fileStream)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Failed to Transfer", http.StatusInternalServerError)
		return
	}

}
