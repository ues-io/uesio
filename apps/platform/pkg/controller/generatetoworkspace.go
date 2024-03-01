package controller

import (
	"archive/zip"
	"bytes"
	"io"
	"net/http"
	"strings"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/types"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

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
	connection, err := datasource.GetPlatformConnection(&wire.MetadataCache{}, session, nil)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	respondWithZIP := strings.Contains(r.Header.Get("Accept"), "/zip")
	buf := new(bytes.Buffer)
	var zipWriter *zip.Writer
	// If we were requested to return a ZIP file,
	// then we need to write the generated ZIP both to the HTTP response body
	// and to the workspace (via buf), so we need a MultiWriter
	if respondWithZIP {
		output := types.MultiWriteCloser(w, buf)
		zipWriter = zip.NewWriter(output)
	} else {
		// Otherwise we just want to generate to the workspace
		zipWriter = zip.NewWriter(buf)
	}
	if err = datasource.CallGeneratorBot(retrieve.NewWriterCreator(zipWriter.Create), namespace, name, params, connection, session); err != nil {
		zipWriter.Close()
		handleError(respondWithZIP, w, r, err)
		return
	}
	if err = zipWriter.Flush(); err != nil {
		handleError(respondWithZIP, w, r, err)
		return
	}
	if err = zipWriter.Close(); err != nil {
		handleError(respondWithZIP, w, r, err)
		return
	}
	if err = deploy.DeployWithOptions(io.NopCloser(buf), session, &deploy.DeployOptions{Upsert: true, Connection: connection}); err != nil {
		handleError(respondWithZIP, w, r, err)
		return
	}
	if !respondWithZIP {
		filejson.RespondJSON(w, r, &bot.BotResponse{
			Success: true,
		})
	}
}

func handleError(respondWithZIP bool, w http.ResponseWriter, r *http.Request, err error) {
	if respondWithZIP {
		ctlutil.HandleError(w, err)
	} else {
		filejson.RespondJSON(w, r, &bot.BotResponse{
			Success: false,
			Error:   err.Error(),
		})
	}
}
