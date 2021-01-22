package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

// ServeComponentPack serves a component pack
func ServeComponentPack(buildMode bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		namespace := vars["namespace"]
		name := vars["name"]

		session := middleware.GetSession(r)

		componentPack := meta.ComponentPack{
			Name:      name,
			Namespace: namespace,
		}

		err := bundle.Load(&componentPack, session)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Not Found", http.StatusNotFound)
			return
		}

		stream, err := bundle.GetComponentPackStream(&componentPack, buildMode, session)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed ComponentPack Download", http.StatusInternalServerError)
			return
		}
		mimeType := "application/javascript"

		respondFile(w, r, mimeType, stream)
	}
}
