package controller

import (
	"archive/zip"
	"encoding/json"
	"io"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/retrieve"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func GenerateToWorkspace(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	var params map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&params)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middleware.GetSession(r)

	retrieveData := bundlestore.GetFileReader(func(data io.Writer) error {
		zipwriter := zip.NewWriter(data)
		err := datasource.CallGeneratorBot(retrieve.NewWriterCreator(zipwriter.Create), namespace, name, params, nil, session)
		if err != nil {
			return err
		}
		return zipwriter.Close()
	})

	err = deploy.Deploy(io.NopCloser(retrieveData), session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	file.RespondJSON(w, r, &bot.BotResponse{
		Success: true,
	})

}
