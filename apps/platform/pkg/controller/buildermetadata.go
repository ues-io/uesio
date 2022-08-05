package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/routing"
)

func BuilderMetadata(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)

	depsCache, err := routing.GetBuilderDependencies(session)
	if err != nil {
		msg := "Failed Getting Builder Metadata: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	respondJSON(w, r, &depsCache)

}
