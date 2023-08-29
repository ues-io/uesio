package controller

import (
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/truncate"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Truncate(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(nil, session, nil)
	if err == nil {
		err = truncate.TruncateWorkspaceData(session, connection)
	}
	if err != nil {
		var responseCode int
		switch err.(type) {
		case *meta.BotParamValidationError:
			responseCode = http.StatusBadRequest
		case *meta.BotAccessError:
			responseCode = http.StatusForbidden
		default:
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			logger.LogError(err)
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
