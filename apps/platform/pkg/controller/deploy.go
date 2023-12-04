package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Deploy(w http.ResponseWriter, r *http.Request) {
	if err := deploy.Deploy(r.Body, middleware.GetSession(r)); err != nil {
		HandleError(w, err)
		return
	}
}
