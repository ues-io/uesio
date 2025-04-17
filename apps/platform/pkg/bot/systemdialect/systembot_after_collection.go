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

func parseUniquekeyToCollectionKey(uniquekey string) (string, error) {
	//ben/greenlink:dev:companymember to ben/greenlink.companymember
	keyArray := strings.Split(uniquekey, ":")
	if len(keyArray) != 3 {
		return "", errors.New("Invalid Collection Key: " + uniquekey)
	}

	return keyArray[0] + "." + keyArray[2], nil
}

func runCollectionAfterSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	// We will end up here through several different avenues and sometimes we will be in an admin context,
	// sometimes in an anon context and sometimes in a workspace context, etc. Additionally, depending on
	// context there may or may not be a request param that contains the workspace ID that would ensure
	// that any loads we do restrict queries to a workspace. Moreover, depending on how we go here, the request.Deletes
	// could span one or more workspaces so we need to ensure that we only delete the collection for the workspace
	// that it is associated with.
	workspaceCollections := make(map[string][]string, len(request.Deletes))
	for _, d := range request.Deletes {
		workspaceId, err := d.GetOldFieldAsString("uesio/studio.workspace->uesio/core.id")
		if err != nil {
			return err
		}
		collectionUniqueKey, err := d.GetOldFieldAsString(commonfields.UniqueKey)
		if err != nil {
			return err
		}
		// collection unique keys will be something like "uesio/tests:dev:rare_and_unusual_object", but the "uesio/studio.collection"
		// field for fields will be something like "uesio/tests.rare_and_unusual_object", so we need to parse this
		collectionName, err := parseUniquekeyToCollectionKey(collectionUniqueKey)
		if err != nil {
			return err
		}
		workspaceCollections[workspaceId] = append(workspaceCollections[workspaceId], collectionName)
	}

	if len(workspaceCollections) == 0 {
		return nil
	}

	var conditions []wire.LoadRequestCondition
	for workspaceId, collectionNames := range workspaceCollections {
		collectionCondition := wire.LoadRequestCondition{
			Field: "uesio/studio.collection",
		}
		if len(collectionNames) > 1 {
			collectionCondition.Operator = "IN"
			collectionCondition.Values = collectionNames
		} else {
			collectionCondition.Operator = "EQ"
			collectionCondition.Value = collectionNames[0]
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
				collectionCondition,
			},
		})
	}

	fc := meta.FieldCollection{}
	if err := datasource.PlatformLoad(&fc, &datasource.PlatformLoadOptions{
		Fields: []wire.LoadRequestField{
			{
				ID: commonfields.Id,
			},
		},
		Conditions: conditions,
		Connection: connection,
		Params:     request.Params,
	}, session); err != nil {
		return err
	}

	rac := meta.RouteAssignmentCollection{}
	if err := datasource.PlatformLoad(&rac, &datasource.PlatformLoadOptions{
		Fields: []wire.LoadRequestField{
			{
				ID: commonfields.Id,
			},
		},
		Conditions: conditions,
		Connection: connection,
		Params:     request.Params,
	}, session); err != nil {
		return err
	}

	rct := meta.RecordChallengeTokenCollection{}
	if err := datasource.PlatformLoad(&rct, &datasource.PlatformLoadOptions{
		Fields: []wire.LoadRequestField{
			{
				ID: commonfields.Id,
			},
		},
		Conditions: conditions,
		Connection: connection,
		Params:     request.Params,
	}, session); err != nil {
		return err
	}

	var requests []datasource.SaveRequest

	if len(fc) > 0 {
		requests = append(requests, datasource.SaveRequest{
			Collection: "uesio/studio.field",
			Wire:       "DeleteCollectionFields",
			Deletes:    &fc,
			Params:     request.Params,
		})
	}

	if len(rac) > 0 {
		requests = append(requests, datasource.SaveRequest{
			Collection: "uesio/studio.routeassignment",
			Wire:       "DeleteCollectionRouteAssignments",
			Deletes:    &rac,
			Params:     request.Params,
		})
	}

	if len(rct) > 0 {
		requests = append(requests, datasource.SaveRequest{
			Collection: "uesio/studio.recordchallengetoken",
			Wire:       "DeleteCollectionRecordChallengeTokens",
			Deletes:    &rct,
			Params:     request.Params,
		})
	}

	// TODO: Should we delete collection data for the workspace?  See https://github.com/ues-io/uesio/issues/4832

	if len(requests) == 0 {
		return nil
	}

	return datasource.SaveWithOptions(requests, session, datasource.NewSaveOptions(connection, nil))

}
