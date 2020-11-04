package controllers

import (
	"errors"
	"io"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
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

	var stream io.ReadCloser
	var mimeType string

	version, err := bundles.GetVersion(namespace, session)
	if err != nil {
		logger.LogError(errors.New("Couldn't get bundle version"))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	bs, err := bundlestore.GetBundleStore(namespace, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	stream, mimeType, err = bs.GetFileStream(namespace, version, &file, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Failed File Download", http.StatusInternalServerError)
		return
	}

	respondFile(w, r, mimeType, stream)

}
