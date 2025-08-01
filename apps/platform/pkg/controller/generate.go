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
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	s := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(r.Context(), s, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	zipWriter := zip.NewWriter(w)
	defer zipWriter.Close()

	// Inject the workspace name and app name so that we can use them in generator logic
	wsParams := getWireParamsFromRequestHeaders(r)
	params["appName"] = wsParams["app"]
	params["workspaceName"] = wsParams["workspacename"]

	_, err = datasource.CallGeneratorBot(r.Context(), retrieve.NewWriterCreator(zipWriter.Create), namespace, name, params, connection, s)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

}
