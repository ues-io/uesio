package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func GetBotParams(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	metadataType := vars["type"]
	session := middleware.GetSession(r)

	if metadataType != "generator" {
		http.Error(w, "Wrong bot type", http.StatusInternalServerError)
		return
	}

	robot := meta.NewGeneratorBot(namespace, name)

	err := bundle.Load(robot, session)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	respondJSON(w, r, robot.Params)
}
