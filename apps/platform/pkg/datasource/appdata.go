package datasource

import (
	"context"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/ns"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func GetAppData(ctx context.Context, namespaces []string, connection wire.Connection) (map[string]ns.NamespaceInfo, error) {
	apps := meta.AppCollection{}

	// Load in App Settings
	err := PlatformLoad(ctx, &apps, &PlatformLoadOptions{
		Conditions: []wire.LoadRequestCondition{
			{
				Field:    commonfields.UniqueKey,
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
			{
				ID: "uesio/studio.description",
			},
		},
		Connection: connection,
	}, sess.GetStudioAnonSession())
	if err != nil {
		return nil, err
	}

	appData := map[string]ns.NamespaceInfo{}

	for index := range apps {
		app := apps[index]
		appData[app.UniqueKey] = ns.NamespaceInfo{
			Color:       app.Color,
			Icon:        app.Icon,
			Namespace:   app.UniqueKey,
			Description: app.Description,
		}
	}

	return appData, nil
}

// QueryAppForWrite queries an app with write access required
func QueryAppForWrite(ctx context.Context, value, field string, session *sess.Session, connection wire.Connection) (*meta.App, error) {
	var app meta.App
	err := PlatformLoadOne(
		ctx,
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
		// TODO: Need to be able to differentiate between "no access" and "not found" here. At higher level, could obscure by always
		// returning a NotFound to client but at this level, ideal if we could differentiate so that callers could handle more appropriately
		// based on their context. For now, assuming we've only reached this code path in situations where we have already confirmed the app
		// exists so treating as Forbidden.
		if exceptions.IsType[*exceptions.NotFoundException](err) {
			return nil, exceptions.NewForbiddenException(fmt.Sprintf("app %s does not exist or you don't have access to modify it", value))
		} else {
			return nil, err
		}
	}
	return &app, nil
}
