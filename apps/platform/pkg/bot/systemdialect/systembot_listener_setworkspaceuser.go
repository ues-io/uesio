package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runSetWorkspaceUserBot(params map[string]interface{}, connection wire.Connection, session *sess.Session) (map[string]interface{}, error) {

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
			Changes: &wire.Collection{
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
			Options: &wire.SaveOptions{
				Upsert: true,
			},
		},
	}, session)
	if err != nil {
		return nil, err
	}

	return nil, nil

}
