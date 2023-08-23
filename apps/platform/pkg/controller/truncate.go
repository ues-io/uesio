package controller

import (
	"github.com/thecloudmasters/uesio/pkg/bot/systemdialect"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Truncate(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(nil, session, nil)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	_, err = systemdialect.RunWorkspaceTruncateListenerBot(nil, connection, session)

	if _, ok := err.(*meta.BotParamValidationError); ok {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if _, ok := err.(*meta.BotAccessError); ok {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}
	if err != nil {
		logger.LogError(err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}
