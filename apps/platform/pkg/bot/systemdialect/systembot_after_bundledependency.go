package systemdialect

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func parseKey(key string) (string, string, error) {
	keyArray := strings.Split(key, ":")
	if len(keyArray) != 3 {
		return "", "", errors.New("Invalid Bundle Dep Key: " + key)
	}
	return keyArray[0], keyArray[2], nil
}

func runBundleDependencyAfterSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	LicenseTemplateDeps := wire.Collection{}
	visited := map[string]bool{}
	corruptedLicenses := wire.Collection{}

	err := request.LoopInserts(func(change *wire.ChangeItem) error {

		applicensed, app, err := parseKey(change.UniqueKey)
		if err != nil {
			return err
		}

		pairKey := app + ":" + applicensed

		//This is for the seed to avoid duplicates
		if visited[pairKey] {
			return nil
		}
		visited[pairKey] = true

		var existingLicense meta.License
		datasource.PlatformLoadOne(
			&existingLicense,
			&datasource.PlatformLoadOptions{
				Connection: connection,

				Conditions: []wire.LoadRequestCondition{
					{
						Field: commonfields.UniqueKey,
						Value: pairKey,
					},
				},
			},
			session,
		)

		if existingLicense.UniqueKey != "" {
			// If the AppLicensed is nil, then this license is corrupted and needs to be recreated
			if existingLicense.AppLicensed == nil {
				corruptedLicenses = append(corruptedLicenses, &wire.Item{
					"uesio/core.id": existingLicense.ID,
				})
			} else {
				return nil
			}
		}

		var lt meta.LicenseTemplate
		datasource.PlatformLoadOne(
			&lt,
			&datasource.PlatformLoadOptions{
				Connection: connection,
				Conditions: []wire.LoadRequestCondition{
					{
						Field: commonfields.UniqueKey,
						Value: app,
					},
				},
			},
			session,
		)

		if lt.AutoCreate {
			LicenseTemplateDeps = append(LicenseTemplateDeps, &wire.Item{
				"uesio/studio.app": map[string]interface{}{
					commonfields.UniqueKey: app,
				},
				"uesio/studio.applicensed": map[string]interface{}{
					commonfields.UniqueKey: applicensed,
				},
				"uesio/studio.active":       true,
				"uesio/studio.monthlyprice": lt.MonthlyPrice,
			})
		}

		return nil

	})

	if err != nil {
		return err
	}

	// Deletes first
	if len(corruptedLicenses) > 0 {
		err = datasource.SaveWithOptions([]datasource.SaveRequest{
			{
				Collection: "uesio/studio.license",
				Wire:       "LicensedWire",
				Deletes:    &corruptedLicenses,
				Options: &wire.SaveOptions{
					Upsert: true,
				},
			},
		}, session, datasource.NewSaveOptions(connection, nil))
		if err != nil {
			return err
		}
	}

	// Inserts next
	err = datasource.SaveWithOptions([]datasource.SaveRequest{
		{
			Collection: "uesio/studio.license",
			Wire:       "LicensedWire",
			Changes:    &LicenseTemplateDeps,
			Options: &wire.SaveOptions{
				Upsert: true,
			},
		},
	}, session, datasource.NewSaveOptions(connection, nil))

	return err

}
