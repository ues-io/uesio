package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runCreateBundleListenerBot(params map[string]interface{}, connection adapt.Connection, session *sess.Session) error {

	app := session.GetContextAppName()

	if app == "" {
		return errors.New("Error creating a new bundle, missing app")
	}

	workspace := session.GetWorkspace()

	if workspace == nil {
		return errors.New("Error creating a new bundle, missing workspace")
	}

	var bundles meta.BundleCollection

	err := PlatformLoad(
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
					Value: app,
				},
			},
		},
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return err
	}

	major := 0
	minor := 0
	patch := 1

	if len(bundles) != 0 {
		lastBundle := bundles.GetItem(0).(*meta.Bundle)
		patch = lastBundle.Patch + 1
	}

	bundle, err := meta.NewBundle(app, major, minor, patch, "")
	if err != nil {
		return err
	}

	wsbs, err := bundlestore.GetBundleStoreByType("workspace")
	if err != nil {
		return err
	}

	return CreateBundle(app, workspace.Name, bundle, wsbs, session)

}
