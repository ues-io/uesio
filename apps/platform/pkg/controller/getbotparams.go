package controller

import (
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func GetBotParams(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	metadataType := strings.ToUpper(vars["type"])
	session := middleware.GetSession(r)

	botParams, err := bot.GetBotParams(namespace, name, metadataType, session)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	filejson.RespondJSON(w, r, botParams)
}
