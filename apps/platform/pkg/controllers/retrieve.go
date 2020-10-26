package controllers

import (
	"fmt"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
)

// Retrieve is good
func Retrieve(w http.ResponseWriter, r *http.Request) {
	s := middlewares.GetSession(r)
	sess := s.GetBrowserSession()
	site := s.GetSite()

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s.zip\"", "retrieve"))

	err := retrieve.Zip(w, site, sess)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}
