package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/truncate"
)

func Truncate(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	if err := truncate.TruncateWorkspaceData(r.Context(), session.GetTenantID(), session); err != nil {
		ctlutil.HandleError(r.Context(), w, err)
	} else {
		filejson.RespondJSON(w, r, map[string]any{
			"success":     true,
			"workspaceId": session.GetWorkspaceID(),
		})
	}
}
