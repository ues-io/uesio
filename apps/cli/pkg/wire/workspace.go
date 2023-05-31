package wire

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func GetAvailableWorkspaceNames(appID string) ([]string, error) {
	names := []string{}

	workspaces, err := GetAvailableWorkspaces(appID)
	if err != nil {
		return nil, err
	}

	if len(workspaces) == 0 {
		return names, nil
	}
	for _, item := range workspaces {
		wsName, err := item.GetFieldAsString("uesio/studio.name")
		if err != nil {
			return nil, err
		}
		names = append(names, wsName)
	}

	return names, nil
}

func GetAvailableWorkspaces(appID string) (adapt.Collection, error) {
	return Load(
		"uesio/studio.workspace",
		&LoadOptions{
			Fields: []adapt.LoadRequestField{
				{
					ID: "uesio/studio.name",
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    "uesio/studio.app",
					RawValue: appID,
				},
			},
		},
	)

}

func CreateNewWorkspace(appId, workspaceName string) (map[string]interface{}, error) {
	response, err := Save("uesio/studio.workspace", []map[string]interface{}{
		{
			"uesio/studio.name": workspaceName,
			"uesio/studio.app": map[string]interface{}{
				"uesio/core.id": appId,
			},
		},
	})
	if err != nil {
		return nil, err
	}

	return response[0], nil
}
