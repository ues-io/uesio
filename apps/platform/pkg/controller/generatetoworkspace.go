package controller

import (
	"archive/zip"
	"bytes"
	"io"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/retrieve"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func GenerateToWorkspace(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	params, err := getParamsFromRequestBody(r)
	if err != nil {
		// this should be a BadRequestException
		ctlutil.HandleError(w, err)
		return
	}

	session := middleware.GetSession(r)

	buf := new(bytes.Buffer)

	zipWriter := zip.NewWriter(buf)
	if err = datasource.CallGeneratorBot(retrieve.NewWriterCreator(zipWriter.Create), namespace, name, params, nil, session); err != nil {
		zipWriter.Close()
		file.RespondJSON(w, r, &bot.BotResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}
	zipWriter.Close()

	if err = deploy.DeployWithOptions(io.NopCloser(buf), session, &deploy.DeployOptions{Upsert: false}); err != nil {
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
