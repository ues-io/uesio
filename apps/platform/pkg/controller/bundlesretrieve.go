package controller

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func BundlesRetrieve(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	vars := mux.Vars(r)

	appID, ok := vars["app"]
	if !ok {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle missing required parameter app"))
		return
	}

	version, ok := vars["version"]
	if !ok {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle missing required parameter version"))
		return
	}

	source, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace:  appID,
		Version:    version,
		Connection: nil,
		Workspace:  nil,
		Context:    session.Context(),
	})
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Getting Bundle: "+err.Error()))
		return
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("; filename=\"%s.zip\"", version))
	if !env.InDevMode() {
		w.Header().Set("Cache-Control", file.CacheFor1Year)
	}
	ctlutil.AddTrailingStatus(w)

	err = source.GetBundleZip(w, nil)
	if err != nil {
		// Note - We are streaming result so Http StatusCode will have been set to 200 after
		// the first Write so we implement custom approach to detecting failure on client
		ctlutil.HandleTrailingError(w, exceptions.NewBadRequestException("Failed Getting Bundle: "+err.Error()))
		return
	}
}
