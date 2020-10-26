package controllers

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
	"github.com/thecloudmasters/uesio/pkg/migrate"
)

// Migrate is good
func Migrate(w http.ResponseWriter, r *http.Request) {
	s := middlewares.GetSession(r)
	sess := s.GetBrowserSession()
	site := s.GetSite()

	err := migrate.Migrate(site, sess)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}
