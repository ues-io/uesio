package controller

import (
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/routing"
)

func BuilderMetadata(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)

	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	deps := routing.NewPreloadMetadata()

	err := routing.GetBuilderDependencies(namespace, name, deps, session)
	if err != nil {
		msg := "Failed Getting Builder Metadata: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	file.RespondJSON(w, r, &deps)

}
