package site

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/cli/pkg/context"
	"github.com/thecloudmasters/cli/pkg/wire"
)

func UseBundle(siteName, newBundleVersion string) error {
	app, err := wire.GetApp()
	if err != nil {
		return err
	}

	// Verify that the requested site exists
	siteExists, err := wire.DoesSiteExist(app.ID, siteName)
	if err != nil {
		return errors.New("unable to verify that the requested site exists")
	}
	if !siteExists {
		return errors.New("the requested site does not exist: " + siteName)
	}

	// The bundle version's unique key is appFullName:major:minor:patch
	parts := strings.Split(strings.TrimPrefix(newBundleVersion, "v"), ".")
	bundleUniqueKey := fmt.Sprintf("%s:%s:%s:%s", app.FullName, parts[0], parts[1], parts[2])
	_, err = wire.Upsert("uesio/studio.site", []map[string]interface{}{
		{
			"uesio/studio.name": siteName,
			"uesio/studio.bundle": map[string]interface{}{
				"uesio/core.uniquekey": bundleUniqueKey,
			},
			"uesio/studio.app": map[string]interface{}{
				"uesio/core.id": app.ID,
			},
		},
	}, &context.AppContext{App: app.FullName})
	return err
}
