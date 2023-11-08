package systemdialect

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func parseUniquekeyToIntegrationTypeKey(uniquekey string) (string, error) {
	//luigi/app:dev:salesforce to luigi/app.salesforce
	keyArray := strings.Split(uniquekey, ":")
	if len(keyArray) != 3 {
		return "", errors.New("invalid integration type key: " + uniquekey)
	}

	return keyArray[0] + "." + keyArray[2], nil
}

// Delete all Integration Actions when an Integration Type is deleted
func runIntegrationTypeAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	var integrationTypeKeys []string
	for i := range request.Deletes {
		integrationTypeKey, err := request.Deletes[i].GetOldFieldAsString("uesio/core.uniquekey")
		if err != nil {
			return err
		}
		integrationTypeKeys = append(integrationTypeKeys, integrationTypeKey)
	}

	if len(integrationTypeKeys) == 0 {
		return nil
	}

	// unique keys will be something like "uesio/tests:dev:salesforce",
	// but the "uesio/studio.integrationtype" field for Integration Actions will be something like "uesio/tests.salesforce",
	// so we need to parse this
	var targetIntegrationTypes []string
	for _, integrationUniqueKey := range integrationTypeKeys {
		targetCollection, err := parseUniquekeyToIntegrationTypeKey(integrationUniqueKey)
		if err != nil {
			return err
		}
		targetIntegrationTypes = append(targetIntegrationTypes, targetCollection)
	}

	if len(targetIntegrationTypes) == 0 {
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
				Field:    "uesio/studio.integrationtype",
				Values:   targetIntegrationTypes,
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
			Wire:       "RunIntegrationTypeAfterSaveBot",
			Deletes:    &iac,
			Params:     request.Params,
		})
	}

	if len(requests) == 0 {
		return nil
	}

	return datasource.SaveWithOptions(requests, session, datasource.GetConnectionSaveOptions(connection))

}
