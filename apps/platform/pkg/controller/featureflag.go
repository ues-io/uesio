package controller

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/francoispqt/gojay"
	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func FeatureFlag(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	user := vars["user"]

	response, err := featureflagstore.GetFeatureFlags(session, user)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	bytes, err := gojay.MarshalJSONArray(response)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	filejson.RespondJSON(w, r, json.RawMessage(bytes))
}

type FeatureFlagSetRequest struct {
	Value interface{} `json:"value"`
	User  string      `json:"user"`
}

func SetFeatureFlag(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	var setRequest FeatureFlagSetRequest
	err := json.NewDecoder(r.Body).Decode(&setRequest)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("invalid request format: "+err.Error()))
		return
	}
	err = featureflagstore.SetValue(namespace+"."+name, setRequest.Value, setRequest.User, session)
	if err != nil {
		// See if this is a flag validation error, and if so return a 400
		if _, ok := err.(*featureflagstore.ValidationError); ok {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		ctlutil.HandleError(w, err)
		return
	}
	filejson.RespondJSON(w, r, &bot.BotResponse{
		Success: true,
	})
}
