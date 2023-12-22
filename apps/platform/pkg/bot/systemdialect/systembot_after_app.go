package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runAppAfterSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	adminSession := datasource.GetSiteAdminSession(session)
	wc := meta.WorkspaceCollection{}
	err := datasource.PlatformLoad(&wc, &datasource.PlatformLoadOptions{
		Fields: []wire.LoadRequestField{
			{
				ID: commonfields.Id,
			},
			{
				ID: "uesio/studio.name",
			},
		},
		Conditions: []wire.LoadRequestCondition{
			{
				Field:    "uesio/studio.app",
				Values:   request.Deletes.GetIDs(),
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
			Params: map[string]interface{}{
				"workspaceid": workspace.ID,
			},
			Options: &wire.SaveOptions{IgnoreMissingRecords: true},
		})
	}

	if len(requests) == 0 {
		return nil
	}

	return datasource.SaveWithOptions(requests, adminSession, datasource.GetConnectionSaveOptions(connection))

}
