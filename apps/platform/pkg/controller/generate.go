package controller

import (
	"archive/zip"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
)

func Generate(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	params, err := getParamsFromRequestBody(r)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	s := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(s, nil)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	zipWriter := zip.NewWriter(w)
	defer zipWriter.Close()

	// Inject the workspace name and app name so that we can use them in generator logic
	wsParams := getWireParamsFromRequestHeaders(r)
	params["appName"] = wsParams["app"]
	params["workspaceName"] = wsParams["workspacename"]

	if err := datasource.CallGeneratorBot(retrieve.NewWriterCreator(zipWriter.Create), namespace, name, params, connection, s); err != nil {
		ctlutil.HandleError(w, err)
		return
	}
}
