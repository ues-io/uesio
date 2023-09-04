package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runSetWorkspaceUserBot(params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {

	workspaceID, hasWorkspaceID := params["workspaceid"]
	if !hasWorkspaceID {
		return nil, errors.New("must provide a workspace id to set the workspace user")
	}

	profileName, hasProfile := params["profile"]
	if !hasProfile {
		return nil, errors.New("must provide a profile to set the workspace user")
	}

	if !session.GetSitePermissions().HasNamedPermission("uesio/studio.workspace_admin") {
		return nil, errors.New("you must be a workspace admin to update workspace user settings")
	}

	err := datasource.Save([]datasource.SaveRequest{
		{
			Collection: "uesio/studio.workspaceuser",
			Changes: &adapt.Collection{
				{
					"uesio/studio.workspace": map[string]interface{}{
						"uesio/core.id": workspaceID,
					},
					"uesio/studio.profile": profileName,
					"uesio/studio.user": map[string]interface{}{
						"uesio/core.id": session.GetSiteUser().ID,
					},
				},
			},
			Options: &adapt.SaveOptions{
				Upsert: true,
			},
		},
	}, session)
	if err != nil {
		return nil, err
	}

	return nil, nil

}
