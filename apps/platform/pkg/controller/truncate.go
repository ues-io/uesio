package controller

import (
	"errors"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Truncate(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	tenantID := session.GetTenantID()

	if tenantID == "site:uesio/studio:prod" {
		err := errors.New("can't truncate studio data")
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	connection, err := datasource.GetPlatformConnection(nil, session, nil)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = connection.BeginTransaction()
	err = connection.Truncate(tenantID)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = connection.CommitTransaction()

}
