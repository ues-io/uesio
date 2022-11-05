package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type MetadataResponse struct {
	Color string `json:"color"`
	Icon  string `json:"icon"`
}

func GetAppData(namespaces []string) (map[string]MetadataResponse, error) {
	apps := meta.AppCollection{}

	// Load in App Settings
	err := PlatformLoad(&apps, &PlatformLoadOptions{
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    adapt.UNIQUE_KEY_FIELD,
				Operator: "IN",
				Value:    namespaces,
			},
		},
		Fields: []adapt.LoadRequestField{
			{
				ID: "uesio/studio.color",
			},
			{
				ID: "uesio/studio.icon",
			},
		},
	}, sess.GetStudioAnonSession())
	if err != nil {
		return nil, err
	}

	appData := map[string]MetadataResponse{}

	for index := range apps {
		app := apps[index]
		appData[app.UniqueKey] = MetadataResponse{
			Color: app.Color,
			Icon:  app.Icon,
		}
	}

	return appData, nil
}
