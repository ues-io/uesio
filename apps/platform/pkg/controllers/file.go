package controllers

import (
	"io"
	"net/http"
	"path/filepath"

	"github.com/gorilla/mux"
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

	s := middlewares.GetSession(r)
	sess := s.GetBrowserSession()
	site := s.GetSite()

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
		// This should use a bundle store just like everything else.
		basePath := filepath.Join("..", "..", "libs", "uesioapps", namespace, "bundle")
		filePath := filepath.Join(basePath, "files", file.FileName)
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
