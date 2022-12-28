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

		componentPack := meta.NewBaseComponentPack(namespace, name)

		err := bundle.Load(componentPack, session, nil)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Not Found", http.StatusNotFound)
			return
		}
		path := componentPack.GetComponentPackFilePath(buildMode)
		stream, err := bundle.GetItemAttachment(componentPack, path, session)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed ComponentPack Download", http.StatusInternalServerError)
			return
		}

		respondFile(w, r, "pack.js", time.Unix(componentPack.UpdatedAt, 0), stream)
	}
}

func ServeComponentPackMap(buildMode bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		namespace := vars["namespace"]
		name := vars["name"]

		session := middleware.GetSession(r)

		componentPack := meta.NewBaseComponentPack(namespace, name)

		err := bundle.Load(componentPack, session, nil)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Not Found", http.StatusNotFound)
			return
		}

		path := componentPack.GetComponentPackFilePath(buildMode)
		stream, err := bundle.GetItemAttachment(componentPack, path+".map", session)
		if err != nil {
			logger.LogError(err)
			http.Error(w, "Failed ComponentPack Download", http.StatusInternalServerError)
			return
		}

		respondFile(w, r, "pack.js", time.Unix(componentPack.UpdatedAt, 0), stream)
	}
}
