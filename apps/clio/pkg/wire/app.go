package wire

import (
	"github.com/thecloudmasters/clio/pkg/config"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func CreateNewApp(user, name, color, icon string) (map[string]interface{}, error) {
	response, err := Save("uesio/studio.app", []map[string]interface{}{
		{
			"uesio/studio.name": name,
			"uesio/studio.user": map[string]interface{}{
				"uesio/core.uniquekey": user,
			},
			"uesio/studio.color": color,
			"uesio/studio.icon":  icon,
		},
	})
	if err != nil {
		return nil, err
	}

	return response[0], nil
}

func GetAppID() (string, error) {
	app, err := config.GetApp()
	if err != nil {
		return "", err
	}

	// Get the current app id
	appResult, err := LoadOne(
		"uesio/studio.app",
		&LoadOptions{
			Fields: []adapt.LoadRequestField{
				{
					ID: "uesio/studio.name",
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/core.uniquekey",
					Value: app,
				},
			},
		},
	)
	if err != nil {
		return "", err
	}

	appID, err := appResult.GetField("uesio/core.id")
	if err != nil {
		return "", err
	}
	return appID.(string), nil
}
