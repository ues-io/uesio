package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type MetadataResponse struct {
	NamespaceInfo `json:",inline"`
	Key           string `json:"key"`
	Label         string `json:"label"`
}

type NamespaceInfo struct {
	Color     string `json:"color"`
	Icon      string `json:"icon"`
	Namespace string `json:"namespace"`
}

func GetAppData(namespaces []string) (map[string]NamespaceInfo, error) {
	apps := meta.AppCollection{}

	// Load in App Settings
	err := PlatformLoad(&apps, &PlatformLoadOptions{
		Conditions: []wire.LoadRequestCondition{
			{
				Field:    wire.UNIQUE_KEY_FIELD,
				Operator: "IN",
				Value:    namespaces,
			},
		},
		Fields: []wire.LoadRequestField{
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

	appData := map[string]NamespaceInfo{}

	for index := range apps {
		app := apps[index]
		appData[app.UniqueKey] = NamespaceInfo{
			Color:     app.Color,
			Icon:      app.Icon,
			Namespace: app.UniqueKey,
		}
	}

	return appData, nil
}

// QueryAppForWrite queries an app with write access required
func QueryAppForWrite(value, field string, session *sess.Session, connection wire.Connection) (*meta.App, error) {
	useSession := session
	if useSession.GetWorkspace() != nil {
		useSession = session.RemoveWorkspaceContext()
	}
	var app meta.App
	err := PlatformLoadOne(
		&app,
		&PlatformLoadOptions{
			Connection: connection,
			Conditions: []wire.LoadRequestCondition{
				{
					Field: field,
					Value: value,
				},
			},
			RequireWriteAccess: true,
		},
		session,
	)
	if err != nil {
		return nil, err
	}
	return &app, nil
}
