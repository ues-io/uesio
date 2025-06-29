package controller

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func CallListenerBot(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	params, err := getParamsFromRequestBody(r)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	session := middleware.GetSession(r)

	returnParams, err := datasource.CallListenerBotInTransaction(namespace, name, params, session)

	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	filejson.RespondJSON(w, r, &bot.BotResponse{
		Params:  returnParams,
		Success: true,
	})
}
