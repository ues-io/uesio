package controller

import (
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

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

		err := bundle.Load(&componentPack, session, nil)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Not Found", http.StatusNotFound)
			return
		}
		path := componentPack.GetComponentPackFilePath(buildMode)
		stream, err := bundle.GetComponentPackStream(&componentPack, path, session)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed ComponentPack Download", http.StatusInternalServerError)
			return
		}

		respondFile(w, r, "pack.js", time.UnixMilli(componentPack.UpdatedAt), stream)
	}
}

func ServeComponentPackMap(buildMode bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		namespace := vars["namespace"]
		name := vars["name"]

		session := middleware.GetSession(r)

		componentPack := meta.ComponentPack{
			Name:      name,
			Namespace: namespace,
		}

		err := bundle.Load(&componentPack, session, nil)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Not Found", http.StatusNotFound)
			return
		}

		path := componentPack.GetComponentPackFilePath(buildMode)
		stream, err := bundle.GetComponentPackStream(&componentPack, path+".map", session)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed ComponentPack Download", http.StatusInternalServerError)
			return
		}

		respondFile(w, r, "pack.js", time.UnixMilli(componentPack.UpdatedAt), stream)
	}
}
