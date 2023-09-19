package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runAppAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	adminSession := datasource.GetSiteAdminSession(session)
	wc := meta.WorkspaceCollection{}
	err := datasource.PlatformLoad(&wc, &datasource.PlatformLoadOptions{
		Fields: []adapt.LoadRequestField{
			{
				ID: adapt.ID_FIELD,
			},
			{
				ID: "uesio/studio.name",
			},
		},
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    "uesio/studio.app",
				Values:   getIDsFromDeletes(request),
				Operator: "IN",
			},
		},
		Connection: connection,
	}, adminSession)
	if err != nil {
		return err
	}

	requests := []datasource.SaveRequest{}

	for _, workspace := range wc {
		requests = append(requests, datasource.SaveRequest{
			Collection: "uesio/studio.workspace",
			Wire:       "RunAppAfterSaveBot",
			Deletes:    &meta.WorkspaceCollection{workspace},
			Params: map[string]string{
				"workspaceid": workspace.ID,
			},
			Options: &adapt.SaveOptions{IgnoreMissingRecords: true},
		})
	}

	if len(requests) == 0 {
		return nil
	}

	return datasource.SaveWithOptions(requests, adminSession, datasource.GetConnectionSaveOptions(connection))

}
