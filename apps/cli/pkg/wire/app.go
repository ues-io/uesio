package wire

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func CreateNewApp(user, name, color, icon string) (*App, error) {
	response, err := Insert("uesio/studio.app", []map[string]interface{}{
		{
			"uesio/studio.name": name,
			"uesio/studio.user": map[string]interface{}{
				"uesio/core.uniquekey": user,
			},
			"uesio/studio.color": color,
			"uesio/studio.icon":  icon,
		},
	}, nil)
	if err != nil {
		return nil, err
	}

	return &App{
		Name:     name,
		FullName: fmt.Sprintf("%s/%s", user, name),
		ID:       response[0]["uesio/core.id"].(string),
	}, nil
}

var appRequestFields = []adapt.LoadRequestField{
	{
		ID: "uesio/studio.name",
	},
	{
		ID: "uesio/studio.fullname",
	},
	{
		ID: "uesio/core.id",
	},
}

type App struct {
	Name     string
	FullName string
	ID       string
}

func NewAppFromItem(item meta.Item) (*App, error) {
	appName, err := item.GetField("uesio/studio.name")
	if err != nil {
		return nil, err
	}
	appNameString, ok := appName.(string)
	if !ok {
		return nil, errors.New("could not convert app name to string")
	}
	appFullName, err := item.GetField("uesio/studio.fullname")
	if err != nil {
		return nil, err
	}
	appFullNameString, ok := appFullName.(string)
	if !ok {
		return nil, errors.New("could not convert app fullname to string")
	}
	appID, err := item.GetField("uesio/core.id")
	if err != nil {
		return nil, err
	}
	appIDString, ok := appID.(string)
	if !ok {
		return nil, errors.New("could not convert app id to string")
	}

	return &App{
		Name:     appNameString,
		FullName: appFullNameString,
		ID:       appIDString,
	}, nil
}

func GetAppID() (string, error) {
	app, err := GetApp()
	if err != nil {
		return "", err
	}
	return app.ID, nil
}

func GetApp() (*App, error) {
	app, err := config.GetApp()
	if err != nil {
		return nil, err
	}

	// Get the current app id
	appResult, err := LoadOne(
		"uesio/studio.app",
		&LoadOptions{
			Fields: appRequestFields,
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    "uesio/core.uniquekey",
					RawValue: app,
				},
			},
		},
	)
	if err != nil {
		return nil, err
	}

	return NewAppFromItem(appResult)
}

// GetApps returns a map containing all apps that the current user can access,
// keyed by app full name
func GetApps() (map[string]*App, error) {

	apps := map[string]*App{}

	// Get the current app id
	appsResult, err := Load(
		"uesio/studio.app",
		&LoadOptions{
			Fields:             appRequestFields,
			RequireWriteAccess: true,
		},
	)
	if err != nil {
		return nil, err
	}

	err = appsResult.Loop(func(item meta.Item, index string) error {
		app, err := NewAppFromItem(item)
		if err != nil {
			return err
		}
		apps[app.FullName] = app
		return nil
	})

	if err != nil {
		return nil, err
	}

	return apps, nil

}
