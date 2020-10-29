package controllers

import (
	"errors"
	"io"
	"mime"
	"net/http"
	"path/filepath"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
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

	session := middlewares.GetSession(r)

	file := metadata.File{
		Name:      name,
		Namespace: namespace,
	}

	err := datasource.LoadMetadataItem(&file, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	var stream io.ReadCloser
	var mimeType string

	if file.Workspace == "" {
		version, err := bundles.GetVersionFromSite(namespace, session.GetSite())
		if err != nil {
			logger.LogError(errors.New("Couldn't get bundle version"))
			return
		}

		stream, err = bundlestore.GetBundleStoreByNamespace(namespace).GetItem(namespace, version, "files", file.FileName)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed File Download", http.StatusInternalServerError)
		}
		mimeType = mime.TypeByExtension(filepath.Ext(file.FileName))
	} else {
		stream, mimeType, err = filesource.Download(file.Content, session)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed Download", http.StatusInternalServerError)
			return
		}
	}

	respondFile(w, r, mimeType, stream)

}
