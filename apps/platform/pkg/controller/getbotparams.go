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
		respondJSON(w, r, "Wrogn bot type")
	}

	robot := meta.NewGeneratorBot(namespace, name)

	err := bundle.Load(robot, session)
	if err != nil {
		respondJSON(w, r, err.Error())
	}

	respondJSON(w, r, robot.Params)
}
