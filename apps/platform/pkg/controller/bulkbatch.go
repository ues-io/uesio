package controller

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/thecloudmasters/uesio/pkg/bulk"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func BulkBatch(w http.ResponseWriter, r *http.Request) {
	batch, err := bulk.NewBatch(r.Body, mux.Vars(r)["job"], middleware.GetSession(r))
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	file.RespondJSON(w, r, &bulk.BatchResponse{
		ID: batch.ID,
	})
}
