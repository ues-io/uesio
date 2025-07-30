package controller

import (
	"net/http"
	"strings"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"

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
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	session := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(r.Context(), session, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	respondWithZIP := strings.Contains(r.Header.Get("Accept"), "/zip")

	if respondWithZIP {
		_, err := deploy.GenerateToWorkspace(r.Context(), namespace, name, params, connection, session, w)
		if err != nil {
			ctlutil.HandleError(r.Context(), w, err)
		}
		return
	}

	response, err := deploy.GenerateToWorkspace(r.Context(), namespace, name, params, connection, session, nil)
	if err != nil {
		filejson.RespondJSON(w, r, &bot.BotResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}
	filejson.RespondJSON(w, r, &bot.BotResponse{
		Success: true,
		Params:  response,
	})

}
