package controller

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func BundlesRetrieve(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	vars := mux.Vars(r)

	appID, ok := vars["app"]
	if !ok {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("failed getting bundle missing required parameter app", nil))
		return
	}

	version, ok := vars["version"]
	if !ok {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("failed getting bundle missing required parameter version", nil))
		return
	}

	source, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace:  appID,
		Version:    version,
		Connection: nil,
		Workspace:  nil,
	})
	if err != nil {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("failed getting bundle", err))
		return
	}

	w.Header().Set("Content-Type", "application/zip")
	file.SetContentDispositionHeader(w, "attachment", version+".zip")
	middleware.Set1YearCache(w)
	ctlutil.AddTrailingStatus(w)

	err = source.GetBundleZip(session.Context(), w, nil)
	if err != nil {
		// Note - We are streaming result so Http StatusCode will have been set to 200 after
		// the first Write so we implement custom approach to detecting failure on client
		ctlutil.HandleTrailingError(r.Context(), w, exceptions.NewBadRequestException("failed getting bundle", err))
		return
	}
}
