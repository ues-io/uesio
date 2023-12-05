package systemdialect

import (
	"errors"
	"strings"

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

	var collectionUniqueKeys []string
	for i := range request.Deletes {
		if collectionUniqueKey, err := request.Deletes[i].GetOldFieldAsString(wire.UNIQUE_KEY_FIELD); err == nil {
			collectionUniqueKeys = append(collectionUniqueKeys, collectionUniqueKey)
		} else {
			return err
		}
	}

	if len(collectionUniqueKeys) == 0 {
		return nil
	}

	// collection unique keys will be something like "uesio/tests:dev:rare_and_unusual_object",
	// but the "uesio/studio.collection" field for fields will be something like "uesio/tests.rare_and_unusual_object",
	// so we need to parse this
	var targetCollections []string
	for _, collectionUniqueKey := range collectionUniqueKeys {
		if targetCollection, err := parseUniquekeyToCollectionKey(collectionUniqueKey); err == nil {
			targetCollections = append(targetCollections, targetCollection)
		} else {
			return err
		}
	}

	if len(targetCollections) == 0 {
		return nil
	}

	fc := meta.FieldCollection{}
	if err := datasource.PlatformLoad(&fc, &datasource.PlatformLoadOptions{
		Fields: []wire.LoadRequestField{
			{
				ID: wire.ID_FIELD,
			},
		},
		Conditions: []wire.LoadRequestCondition{
			{
				Field:    "uesio/studio.collection",
				Values:   targetCollections,
				Operator: "IN",
			},
		},
		Connection: connection,
		Params:     request.Params,
	}, session); err != nil {
		return err
	}

	rac := meta.RouteAssignmentCollection{}
	if err := datasource.PlatformLoad(&rac, &datasource.PlatformLoadOptions{
		Fields: []wire.LoadRequestField{
			{
				ID: wire.ID_FIELD,
			},
		},
		Conditions: []wire.LoadRequestCondition{
			{
				Field:    "uesio/studio.collection",
				Values:   targetCollections,
				Operator: "IN",
			},
		},
		Connection: connection,
		Params:     request.Params,
	}, session); err != nil {
		return err
	}

	rct := meta.RecordChallengeTokenCollection{}
	if err := datasource.PlatformLoad(&rct, &datasource.PlatformLoadOptions{
		Fields: []wire.LoadRequestField{
			{
				ID: wire.ID_FIELD,
			},
		},
		Conditions: []wire.LoadRequestCondition{
			{
				Field:    "uesio/studio.collection",
				Values:   targetCollections,
				Operator: "IN",
			},
		},
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

	if len(requests) == 0 {
		return nil
	}

	return datasource.SaveWithOptions(requests, session, datasource.GetConnectionSaveOptions(connection))

}
