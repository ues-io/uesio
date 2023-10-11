package systemdialect

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func parseUniquekeyToIntegrationKey(uniquekey string) (string, error) {
	//luigi/app:dev:salesforce to luigi/app.salesforce
	keyArray := strings.Split(uniquekey, ":")
	if len(keyArray) != 3 {
		return "", errors.New("invalid integration key: " + uniquekey)
	}

	return keyArray[0] + "." + keyArray[2], nil
}

// Delete all Integration Actions when an Integration is deleted
func runIntegrationAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	var integrationKeys []string
	for i := range request.Deletes {
		integrationKey, err := request.Deletes[i].GetOldFieldAsString("uesio/core.uniquekey")
		if err != nil {
			return err
		}
		integrationKeys = append(integrationKeys, integrationKey)
	}

	if len(integrationKeys) == 0 {
		return nil
	}

	// unique keys will be something like "uesio/tests:dev:salesforce",
	// but the "uesio/studio.integration" field for fields will be something like "uesio/tests.salesforce",
	// so we need to parse this
	var targetIntegrations []string
	for _, integrationUniqueKey := range integrationKeys {
		targetCollection, err := parseUniquekeyToIntegrationKey(integrationUniqueKey)
		if err != nil {
			return err
		}
		targetIntegrations = append(targetIntegrations, targetCollection)
	}

	if len(targetIntegrations) == 0 {
		return nil
	}

	iac := meta.IntegrationActionCollection{}
	err := datasource.PlatformLoad(&iac, &datasource.PlatformLoadOptions{
		Fields: []adapt.LoadRequestField{
			{
				ID: "uesio/core.id",
			},
		},
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    "uesio/studio.integration",
				Values:   targetIntegrations,
				Operator: "IN",
			},
		},
		Connection: connection,
		Params:     request.Params,
	}, session)
	if err != nil {
		return err
	}

	var requests []datasource.SaveRequest

	if len(iac) > 0 {
		requests = append(requests, datasource.SaveRequest{
			Collection: "uesio/studio.integrationaction",
			Wire:       "RunIntegrationAfterSaveBot",
			Deletes:    &iac,
			Params:     request.Params,
		})
	}

	if len(requests) == 0 {
		return nil
	}

	return datasource.SaveWithOptions(requests, session, datasource.GetConnectionSaveOptions(connection))

}
