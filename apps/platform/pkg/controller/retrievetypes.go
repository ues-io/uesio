package controller

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
)

func RetrieveAppTypes(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	app := vars["app"]
	bs, err := bundle.GetBundleStoreConnection(app, session, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	w.Header().Set("Content-Type", "application/typescript")
	if err := retrieve.GenerateAppTypeScriptTypes(r.Context(), w, bs); err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	w.WriteHeader(200)
}
