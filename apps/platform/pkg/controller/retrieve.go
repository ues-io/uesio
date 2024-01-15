package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Retrieve(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	app := vars["app"]

	bs, err := bundle.GetBundleStoreConnection(app, session, nil)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	if err := bs.GetBundleZip(w, session); err != nil {
		ctlutil.HandleError(w, err)
		return
	}
}
