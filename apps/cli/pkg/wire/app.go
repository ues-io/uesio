package wire

import (
	"errors"

	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
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

type App struct {
	Name     string
	FullName string
	ID       string
}

// GetApps returns a map containing all apps that the current user can access,
// keyed by app full name
func GetApps() (map[string]*App, error) {

	apps := map[string]*App{}

	// Get the current app id
	appsResult, err := Load(
		"uesio/studio.app",
		&LoadOptions{
			Fields: []adapt.LoadRequestField{
				{
					ID: "uesio/studio.name",
				},
				{
					ID: "uesio/studio.fullname",
				},
				{
					ID: "uesio/core.id",
				},
			},
		},
	)
	if err != nil {
		return nil, err
	}

	err = appsResult.Loop(func(item meta.Item, index string) error {
		appName, err := item.GetField("uesio/studio.name")
		if err != nil {
			return err
		}
		appNameString, ok := appName.(string)
		if !ok {
			return errors.New("could not convert app name to string")
		}
		appFullName, err := item.GetField("uesio/studio.fullname")
		if err != nil {
			return err
		}
		appFullNameString, ok := appFullName.(string)
		if !ok {
			return errors.New("could not convert app fullname to string")
		}
		appID, err := item.GetField("uesio/core.id")
		if err != nil {
			return err
		}
		appIDString, ok := appID.(string)
		if !ok {
			return errors.New("could not convert app id to string")
		}

		app := &App{
			Name:     appNameString,
			FullName: appFullNameString,
			ID:       appIDString,
		}

		apps[app.FullName] = app

		return nil
	})

	if err != nil {
		return nil, err
	}

	return apps, nil

}
