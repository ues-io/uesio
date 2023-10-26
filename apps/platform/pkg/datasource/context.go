package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// GetParamsFromSession returns a map of parameters needed for querying / saving
// if you have a workspace / site admin context
func GetParamsFromSession(session *sess.Session) map[string]string {
	params := map[string]string{}
	if session.GetWorkspace() != nil {
		params["workspacename"] = session.GetWorkspace().Name
		params["app"] = session.GetWorkspace().GetAppFullName()
	} else if session.GetSiteAdmin() != nil {
		params["sitename"] = session.GetSiteAdmin().Name
		params["app"] = session.GetSiteAdmin().GetAppFullName()
	}
	return params
}
