package wire

import (
	"fmt"

	"github.com/thecloudmasters/cli/pkg/context"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
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

func GetAvailableWorkspaces(appID string) (wire.Collection, error) {
	return Load(
		"uesio/studio.workspace",
		&LoadOptions{
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/studio.name",
				},
			},
			Conditions: []wire.LoadRequestCondition{
				{
					Field:    "uesio/studio.app",
					RawValue: appID,
				},
			},
		},
	)

}

func CreateNewWorkspace(appId, workspaceName string) (map[string]interface{}, error) {
	response, err := Insert("uesio/studio.workspace", []map[string]interface{}{
		{
			"uesio/studio.name": workspaceName,
			"uesio/studio.app": map[string]interface{}{
				"uesio/core.id": appId,
			},
		},
	}, nil)
	if err != nil {
		return nil, err
	}

	return response[0], nil
}

func DeleteWorkspace(appFullName, workspaceName string) (bool, error) {
	workspaceUniqueKey := fmt.Sprintf("%s:%s", appFullName, workspaceName)
	return DeleteOne("uesio/studio.workspace", "uesio/core.uniquekey", workspaceUniqueKey, context.NewWorkspaceContext(appFullName, workspaceName))
}
