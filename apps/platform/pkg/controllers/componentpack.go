package controllers

import (
	"errors"
	"io"
	"net/http"

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

		componentPack := metadata.ComponentPack{
			Name:      name,
			Namespace: namespace,
		}

		err := bundles.Load(&componentPack, session)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Not Found", http.StatusNotFound)
			return
		}

		var stream io.ReadCloser
		var mimeType string
		workspaceID := session.GetWorkspaceID()
		if componentPack.Workspace == "" {
			version := ""
			var err error
			if workspaceID != "" {
				version, err = datasource.GetDependencyVersionForWorkspace(namespace, session)
			} else {
				version, err = bundles.GetVersion(namespace, session)
			}
			if err != nil {
				msg := "Couldn't get bundle version: " + err.Error()
				logger.LogError(errors.New(msg))
				http.Error(w, msg, http.StatusInternalServerError)
				return
			}

			bs, err := bundlestore.GetBundleStore(namespace, session)
			if err != nil {
				logger.LogError(err)
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			stream, err = bs.GetComponentPackStream(namespace, version, buildMode, &componentPack, session)
			if err != nil {
				logger.LogError(err)
				http.Error(w, "Failed ComponentPack Download", http.StatusInternalServerError)
				return
			}
			mimeType = "application/javascript"
		} else {
			// Not Quite ready for this yet.
			http.Error(w, "Component Packs Don't work in Workspaces yet", http.StatusInternalServerError)
			return
		}

		respondFile(w, r, mimeType, stream)
	}
}
