package controller

import (
	"fmt"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/preload"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/routing"
)

func BuilderMetadata(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	deps := preload.NewPreloadMetadata()

	// Clear out the wire dependency, we don't want to send any wire data to the client.
	deps.Wire = nil
	deps.Collection = nil

	if err := routing.GetBuilderDependencies(namespace, name, deps, session); err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException(fmt.Errorf("Failed Getting Builder Metadata: %w", err)))
		return
	}

	filejson.RespondJSON(w, r, &deps)

}
