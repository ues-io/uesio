package controller

import (
	"encoding/json"
	"fmt"
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
		ctlutil.HandleError(w, exceptions.NewBadRequestException(fmt.Errorf("invalid job spec request: %w", err)))
		return
	}

	session := middleware.GetSession(r)

	spec := meta.JobSpec(specRequest)
	jobID, err := bulk.NewJob(&spec, session)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException(fmt.Errorf("Failed Creating New Job: %w", err)))
		return
	}

	filejson.RespondJSON(w, r, &bulktypes.JobResponse{
		ID: jobID,
	})

}
