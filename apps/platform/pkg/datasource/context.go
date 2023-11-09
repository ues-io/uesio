package datasource

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// GetParamsFromSession returns a map of parameters needed for querying / saving
// if you have a workspace / site admin context
func GetParamsFromSession(session *sess.Session) map[string]string {
	params := map[string]string{}
	if session.GetWorkspace() != nil {
		//TO-DO
		appFullName, _ := session.GetWorkspace().GetAppFullName()
		params["workspacename"] = session.GetWorkspace().Name
		params["app"] = appFullName
	} else if session.GetSiteAdmin() != nil {
		params["sitename"] = session.GetSiteAdmin().Name
		params["app"] = session.GetSiteAdmin().GetAppFullName()
	}
	return params
}

func GetContextSessionFromParams(params map[string]string, connection adapt.Connection, session *sess.Session) (*sess.Session, error) {

	workspace := params["workspacename"]
	site := params["sitename"]
	if workspace == "" && site == "" {
		return nil, errors.New("no workspace name or site name parameter provided")
	}
	app := params["app"]
	if app == "" {
		return nil, errors.New("no app parameter provided")
	}

	if workspace != "" {
		workspaceKey := fmt.Sprintf("%s:%s", app, workspace)
		return AddWorkspaceContextByKey(workspaceKey, session, connection)
	}

	siteKey := fmt.Sprintf("%s:%s", app, site)
	return AddSiteAdminContextByKey(siteKey, session, connection)

}
