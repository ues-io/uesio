package controller

import (
	"io/ioutil"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

// Deploy is good
func Deploy(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)

	// Unfortunately, we have to read the whole thing into memory
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = deploy.Deploy(body, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}
