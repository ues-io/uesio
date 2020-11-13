package controllers

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundles"
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

		stream, err := bundles.GetComponentPackStream(&componentPack, buildMode, session)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed ComponentPack Download", http.StatusInternalServerError)
			return
		}
		mimeType := "application/javascript"

		respondFile(w, r, mimeType, stream)
	}
}
