package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/truncate"
)

func Truncate(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	if err := truncate.TruncateWorkspaceData(session.GetTenantID(), session); err != nil {
		ctlutil.HandleError(w, err)
	} else {
		file.RespondJSON(w, r, map[string]interface{}{
			"success":     true,
			"workspaceId": session.GetWorkspaceID(),
		})
	}
}
