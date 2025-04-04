package controller

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/thecloudmasters/uesio/pkg/bulk"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	bulktypes "github.com/thecloudmasters/uesio/pkg/types/bulk"
)

func BulkJob(w http.ResponseWriter, r *http.Request) {
	// 1. Parse the request object.
	var specRequest meta.JobSpecRequest
	if err := json.NewDecoder(r.Body).Decode(&specRequest); err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("invalid job spec request", err))
		return
	}

	session := middleware.GetSession(r)

	spec := meta.JobSpec(specRequest)
	jobID, err := bulk.NewJob(&spec, session)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Failed Creating New Job", err))
		return
	}

	filejson.RespondJSON(w, r, &bulktypes.JobResponse{
		ID: jobID,
	})

}
