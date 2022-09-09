package wire

import (
	"github.com/thecloudmasters/clio/pkg/config"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func GetAppID() (string, error) {
	app, err := config.GetApp()
	if err != nil {
		return "", err
	}

	// Get the current app id
	appResult, err := LoadOne(
		"uesio/studio.app",
		[]adapt.LoadRequestField{
			{
				ID: "uesio/studio.name",
			},
		},
		[]adapt.LoadRequestCondition{
			{
				Field: "uesio/core.uniquekey",
				Value: app,
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
