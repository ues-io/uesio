package datasource

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
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

	newDeps := adapt.Collection{}
	visited := map[string]bool{}
	request.LoopInserts(func(change *adapt.ChangeItem) error {

		//CRM will use CMS --> "uesio/crm:dev:uesio/cms"
		applicensed, app, err := parseKey(change.UniqueKey)
		if err != nil {
			return err
		}

		pairKey := applicensed + ":" + app

		if visited[pairKey] {
			return nil
		}

		visited[pairKey] = true

		//query CMS license tempalte?
		//Price and autoactive needs to be queried here

		newDeps = append(newDeps, &adapt.Item{
			"uesio/studio.app": map[string]interface{}{
				adapt.UNIQUE_KEY_FIELD: app,
			},
			"uesio/studio.applicensed": map[string]interface{}{
				adapt.UNIQUE_KEY_FIELD: applicensed,
			},
			"uesio/studio.active": true,
		})

		return nil

	})

	err := SaveWithOptions([]SaveRequest{
		{
			Collection: "uesio/studio.license",
			Wire:       "LicensedWire",
			Changes:    &newDeps,
			Options: &adapt.SaveOptions{
				Upsert: true,
			},
		},
	}, session, GetConnectionSaveOptions(connection))

	return err

}
