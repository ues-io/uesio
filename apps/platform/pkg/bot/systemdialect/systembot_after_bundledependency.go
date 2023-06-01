package systemdialect

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func parseKey(key string) (string, string, error) {
	keyArray := strings.Split(key, ":")
	if len(keyArray) != 3 {
		return "", "", errors.New("Invalid Bundle Dep Key: " + key)
	}
	return keyArray[0], keyArray[2], nil
}

func runBundleDependencyAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	LicenseTemplateDeps := adapt.Collection{}
	visited := map[string]bool{}
	corruptedLicenses := adapt.Collection{}

	err := request.LoopInserts(func(change *adapt.ChangeItem) error {

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

				Conditions: []adapt.LoadRequestCondition{
					{
						Field:  adapt.UNIQUE_KEY_FIELD,
						Value:  pairKey,
						Active: true,
					},
				},
			},
			session,
		)

		if existingLicense.UniqueKey != "" {
			// If the AppLicensed is nil, then this license is corrupted and needs to be recreated
			if existingLicense.AppLicensed == nil {
				corruptedLicenses = append(corruptedLicenses, &adapt.Item{
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
				Conditions: []adapt.LoadRequestCondition{
					{
						Field:  adapt.UNIQUE_KEY_FIELD,
						Value:  app,
						Active: true,
					},
				},
			},
			session,
		)

		if lt.AutoCreate {
			LicenseTemplateDeps = append(LicenseTemplateDeps, &adapt.Item{
				"uesio/studio.app": map[string]interface{}{
					adapt.UNIQUE_KEY_FIELD: app,
				},
				"uesio/studio.applicensed": map[string]interface{}{
					adapt.UNIQUE_KEY_FIELD: applicensed,
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
				Options: &adapt.SaveOptions{
					Upsert: true,
				},
			},
		}, session, datasource.GetConnectionSaveOptions(connection))
	}

	// Inserts next
	err = datasource.SaveWithOptions([]datasource.SaveRequest{
		{
			Collection: "uesio/studio.license",
			Wire:       "LicensedWire",
			Changes:    &LicenseTemplateDeps,
			Options: &adapt.SaveOptions{
				Upsert: true,
			},
		},
	}, session, datasource.GetConnectionSaveOptions(connection))

	return err

}
