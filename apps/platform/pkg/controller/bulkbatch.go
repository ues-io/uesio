package controller

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"

	"github.com/thecloudmasters/uesio/pkg/bulk"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	bulktypes "github.com/thecloudmasters/uesio/pkg/types/bulk"
)

func BulkBatch(w http.ResponseWriter, r *http.Request) {
	batch, err := bulk.NewBatch(r.Body, mux.Vars(r)["job"], middleware.GetSession(r))
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	filejson.RespondJSON(w, r, &bulktypes.BatchResponse{
		ID: batch.ID,
	})
}
