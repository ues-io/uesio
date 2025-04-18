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

func parseUniquekeyToIntegrationTypeKey(uniquekey string) (string, error) {
	//luigi/app:dev:salesforce to luigi/app.salesforce
	keyArray := strings.Split(uniquekey, ":")
	if len(keyArray) != 3 {
		return "", errors.New("invalid integration type key: " + uniquekey)
	}

	return keyArray[0] + "." + keyArray[2], nil
}

// Delete all Integration Actions when an Integration Type is deleted
func runIntegrationTypeAfterSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	// We will end up here through several different avenues and sometimes we will be in an admin context,
	// sometimes in an anon context and sometimes in a workspace context, etc. Additionally, depending on
	// context there may or may not be a request param that contains the workspace ID that would ensure
	// that any loads we do restrict queries to a workspace. Moreover, depending on how we go here, the request.Deletes
	// could span one or more workspaces so we need to ensure that we only delete the integration type for the workspace
	// that it is associated with.
	workspaceIntegrationTypes := make(map[string][]string, len(request.Deletes))
	for _, d := range request.Deletes {
		workspaceId, err := d.GetOldFieldAsString("uesio/studio.workspace->uesio/core.id")
		if err != nil {
			return err
		}
		integrationTypeUniqueKey, err := d.GetOldFieldAsString(commonfields.UniqueKey)
		if err != nil {
			return err
		}
		// unique keys will be something like "uesio/tests:dev:salesforce", but the "uesio/studio.integrationtype" field for Integration
		// Actions will be something like "uesio/tests.salesforce", so we need to parse this
		integrationTypeName, err := parseUniquekeyToIntegrationTypeKey(integrationTypeUniqueKey)
		if err != nil {
			return err
		}
		workspaceIntegrationTypes[workspaceId] = append(workspaceIntegrationTypes[workspaceId], integrationTypeName)
	}

	if len(workspaceIntegrationTypes) == 0 {
		return nil
	}

	var conditions []wire.LoadRequestCondition
	for workspaceId, integrationTypes := range workspaceIntegrationTypes {
		integrationTypesCondition := wire.LoadRequestCondition{
			Field: "uesio/studio.integrationtype",
		}
		if len(integrationTypes) > 1 {
			integrationTypesCondition.Operator = "IN"
			integrationTypesCondition.Values = integrationTypes
		} else {
			integrationTypesCondition.Operator = "EQ"
			integrationTypesCondition.Value = integrationTypes[0]
		}
		conditions = append(conditions, wire.LoadRequestCondition{
			Type:        "GROUP",
			Conjunction: "AND",
			SubConditions: []wire.LoadRequestCondition{
				{
					Field:    "uesio/studio.workspace",
					Value:    workspaceId,
					Operator: "EQ",
				},
				integrationTypesCondition,
			},
		})
	}

	iac := meta.IntegrationActionCollection{}
	err := datasource.PlatformLoad(&iac, &datasource.PlatformLoadOptions{
		Fields: []wire.LoadRequestField{
			{
				ID: "uesio/core.id",
			},
		},
		Conditions: conditions,
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

	return datasource.SaveWithOptions(requests, session, datasource.NewSaveOptions(connection, nil))

}
