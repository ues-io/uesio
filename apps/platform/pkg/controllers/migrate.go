package controllers

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
	"github.com/thecloudmasters/uesio/pkg/migrate"
)

// Migrate is good
func Migrate(w http.ResponseWriter, r *http.Request) {
	session := middlewares.GetSession(r)

	err := migrate.Migrate(session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}
