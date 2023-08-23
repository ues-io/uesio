package controller

import (
	"github.com/thecloudmasters/uesio/pkg/bot/systemdialect"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Truncate(w http.ResponseWriter, r *http.Request) {
	// we don't need to provide a connection here, the method will provide one for us
	session := middleware.GetSession(r)
	_, err := systemdialect.RunWorkspaceTruncateListenerBot(nil, nil, session)
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
