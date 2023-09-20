package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Deploy(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	err := deploy.Deploy(r.Body, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
