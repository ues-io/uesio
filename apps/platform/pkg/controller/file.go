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

func ServeFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	session := middleware.GetSession(r)

	file := meta.File{
		Name: name,
		BundleableBase: meta.BundleableBase{
			Namespace: namespace,
		},
	}

	err := bundle.Load(&file, session, nil)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	stream, err := bundle.GetItemAttachment(&file, file.Path, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Failed File Download", http.StatusInternalServerError)
		return
	}

	respondFile(w, r, file.Path, time.Unix(file.UpdatedAt, 0), stream)

}
