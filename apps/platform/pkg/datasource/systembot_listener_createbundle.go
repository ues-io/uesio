package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runCreateBundleListenerBot(params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {

	appID := session.GetContextAppName()

	if appID == "" {
		return nil, errors.New("Error creating a new bundle, missing app")
	}

	workspace := session.GetWorkspace()

	if workspace == nil {
		return nil, errors.New("Error creating a new bundle, missing workspace")
	}

	var app meta.App
	err := PlatformLoadOne(
		&app,
		&PlatformLoadOptions{
			Connection: connection,
			Fields: []adapt.LoadRequestField{
				{
					ID: adapt.ID_FIELD,
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: adapt.UNIQUE_KEY_FIELD,
					Value: appID,
				},
			},
		},
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return nil, err
	}

	var bundles meta.BundleCollection
	err = PlatformLoad(
		&bundles,
		&PlatformLoadOptions{
			Orders: []adapt.LoadRequestOrder{
				{
					Field: "uesio/studio.major",
					Desc:  true,
				},
				{
					Field: "uesio/studio.minor",
					Desc:  true,
				},
				{
					Field: "uesio/studio.patch",
					Desc:  true,
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/studio.app",
					Value: app.ID,
				},
			},
		},
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return nil, err
	}

	major := 0
	minor := 0
	patch := 1

	if len(bundles) != 0 {
		lastBundle := bundles[0]
		patch = lastBundle.Patch + 1
	}

	bundle, err := meta.NewBundle(appID, major, minor, patch, "")
	if err != nil {
		return nil, err
	}

	wsbs, err := bundlestore.GetBundleStoreByType("workspace")
	if err != nil {
		return nil, err
	}

	return nil, CreateBundle(appID, workspace.Name, bundle, wsbs, session)

}
