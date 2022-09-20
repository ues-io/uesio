package wire

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func GetAvailableWorkspaceNames() ([]string, error) {
	names := []string{}

	workspaces, err := GetAvailaleWorkspaces()
	if err != nil {
		return nil, err
	}

	for _, item := range workspaces {
		wsName, err := item.GetField("uesio/studio.name")
		if err != nil {
			return nil, err
		}
		wsString, ok := wsName.(string)
		if !ok {
			return nil, errors.New("Could not convert workspace name to string")
		}
		names = append(names, wsString)
	}

	return names, nil
}

func GetAvailaleWorkspaces() (adapt.Collection, error) {

	appID, err := GetAppID()
	if err != nil {
		return nil, err
	}

	return Load(
		"uesio/studio.workspace",
		[]adapt.LoadRequestField{
			{
				ID: "uesio/studio.name",
			},
		},
		[]adapt.LoadRequestCondition{
			{
				Field: "uesio/studio.app",
				Value: appID,
			},
		},
	)

}
