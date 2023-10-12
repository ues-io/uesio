package controller

import (
	"log/slog"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/routing"
)

func BuilderMetadata(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)

	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	deps := routing.NewPreloadMetadata()

	// Clear out the wire dependency, we don't want to send any wire data to the client.
	deps.Wire = nil
	deps.Collection = nil

	err := routing.GetBuilderDependencies(namespace, name, deps, session)
	if err != nil {
		msg := "Failed Getting Builder Metadata: " + err.Error()
		slog.Error(msg)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	file.RespondJSON(w, r, &deps)

}
