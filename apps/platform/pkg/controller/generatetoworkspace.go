package controller

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/retrieve"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/deploy"
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
		slog.Error(msg)
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

	err = deploy.DeployWithOptions(io.NopCloser(buf), session, &deploy.DeployOptions{Upsert: false})
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
