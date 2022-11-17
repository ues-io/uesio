package datasource

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func parseKey(key string) (string, string, error) {
	keyArray := strings.Split(key, ":")
	if len(keyArray) != 3 {
		return "", "", errors.New("Invalid Key: " + key)
	}
	return keyArray[0], keyArray[2], nil
}

func runBundleDependencyAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	LicenseTemplateDeps := adapt.Collection{}
	visited := map[string]bool{}
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
		PlatformLoadOne(
			&existingLicense,
			&PlatformLoadOptions{
				Connection: connection,
				Conditions: []adapt.LoadRequestCondition{
					{
						Field: adapt.UNIQUE_KEY_FIELD,
						Value: pairKey,
					},
				},
			},
			session,
		)

		if existingLicense.UniqueKey != "" {
			return nil
		}

		var lt meta.LicenseTemplate
		PlatformLoadOne(
			&lt,
			&PlatformLoadOptions{
				Connection: connection,
				Conditions: []adapt.LoadRequestCondition{
					{
						Field: adapt.UNIQUE_KEY_FIELD,
						Value: app,
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

	err = SaveWithOptions([]SaveRequest{
		{
			Collection: "uesio/studio.license",
			Wire:       "LicensedWire",
			Changes:    &LicenseTemplateDeps,
			Options: &adapt.SaveOptions{
				Upsert: true,
			},
		},
	}, session, GetConnectionSaveOptions(connection))

	return err

}
