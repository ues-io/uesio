package controller

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/retrieve"

	"github.com/gorilla/mux"
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
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middleware.GetSession(r)

	buf := new(bytes.Buffer)

	zipwriter := zip.NewWriter(buf)
	err = datasource.CallGeneratorBot(retrieve.NewWriterCreator(zipwriter.Create), namespace, name, params, nil, session)
	if err != nil {
		file.RespondJSON(w, r, &bot.BotResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}
	zipwriter.Close()

	err = deploy.Deploy(io.NopCloser(buf), session)
	if err != nil {
		file.RespondJSON(w, r, &bot.BotResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	file.RespondJSON(w, r, &bot.BotResponse{
		Success: true,
	})

}
