package controller

import (
	"log/slog"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/truncate"

	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Truncate(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	tenantID := session.GetTenantID()
	err := truncate.TruncateWorkspaceData(tenantID, session)
	if err != nil {
		var responseCode int
		switch err.(type) {
		case *meta.BotParamValidationError, *meta.BotExecutionError:
			responseCode = http.StatusBadRequest
		case *meta.BotAccessError:
			responseCode = http.StatusForbidden
		default:
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			slog.Error(err.Error())
			return
		}
		http.Error(w, err.Error(), responseCode)
		return
	}
	file.RespondJSON(w, r, map[string]interface{}{
		"success":     true,
		"workspaceId": session.GetWorkspaceID(),
	})
}
