package controller

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
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

	appName := strings.ReplaceAll(session.GetContextAppName(), "/", "_")
	versionName := strings.ReplaceAll(session.GetContextVersionName(), "/", "_")
	fileName := strings.ReplaceAll(fmt.Sprintf("uesio_retrieve_%s_%s_%s", appName, versionName, time.Now().Format(time.RFC3339)), ":", "_")
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s.zip\"", fileName))

	if err := bs.GetBundleZip(w, &bundlestore.BundleZipOptions{
		// Only include generated types if we're in a workspace context
		IncludeGeneratedTypes: session.GetWorkspaceSession() != nil,
	}); err != nil {
		ctlutil.HandleError(w, err)
		return
	}
}
