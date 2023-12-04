package controller

import (
	"archive/zip"
	"net/http"

	"github.com/gorilla/mux"

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
		HandleError(w, err)
		return
	}
	session := middleware.GetSession(r)
	zipWriter := zip.NewWriter(w)

	if err := datasource.CallGeneratorBot(retrieve.NewWriterCreator(zipWriter.Create), namespace, name, params, nil, session); err != nil {
		zipWriter.Close()
		HandleError(w, err)
		return
	}
	zipWriter.Close()

}
