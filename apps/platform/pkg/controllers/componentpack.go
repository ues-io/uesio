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
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// ServeComponentPack serves a component pack
func ServeComponentPack(buildMode bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		namespace := vars["namespace"]
		name := vars["name"]

		session := middlewares.GetSession(r)

		fileName := namespace + "." + name + ".bundle.js"
		if buildMode {
			fileName = namespace + "." + name + ".builder.bundle.js"
		}

		componentPack := metadata.ComponentPack{
			Name:      name,
			Namespace: namespace,
		}

		err := datasource.LoadMetadataItem(&componentPack, session)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Not Found", http.StatusNotFound)
			return
		}

		var stream io.ReadCloser
		var mimeType string
		workspaceId := session.GetWorkspaceID()
		if componentPack.Workspace == "" {
			version := ""
			var err error
			if workspaceId != "" {
				version, err = datasource.GetDependencyVersionForWorkspace(namespace, session)
			} else {
				version, err = bundles.GetVersionFromSite(namespace, session.GetSite())
			}
			if err != nil {
				msg := "Couldn't get bundle version: " + err.Error()
				logger.LogError(errors.New(msg))
				http.Error(w, msg, http.StatusInternalServerError)
				return
			}

			stream, err = bundlestore.GetBundleStoreByNamespace(namespace).GetItem(namespace, version, "componentpacks", fileName)
			if err != nil {
				logger.LogError(err)
				http.Error(w, "Failed ComponentPack Download", http.StatusInternalServerError)
				return
			}
			mimeType = mime.TypeByExtension(filepath.Ext(fileName))
		} else {
			// Not Quite ready for this yet.
			http.Error(w, "Component Packs Don't work in Workspaces yet", http.StatusInternalServerError)
			return
		}

		respondFile(w, r, mimeType, stream)
	}
}
