package systemdialect

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func parseUniquekeyToCollectionKey(uniquekey string) (string, error) {
	//ben/greenlink:dev:companymember to ben/greenlink.companymember
	keyArray := strings.Split(uniquekey, ":")
	if len(keyArray) != 3 {
		return "", errors.New("Invalid Collection Key: " + uniquekey)
	}

	return keyArray[0] + "." + keyArray[2], nil
}

func runCollectionAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	collectionUniqueKeys := []string{}
	for i := range request.Deletes {
		collectionUniqueKey, err := request.Deletes[i].GetOldFieldAsString("uesio/core.uniquekey")
		if err != nil {
			return err
		}
		collectionUniqueKeys = append(collectionUniqueKeys, collectionUniqueKey)
	}

	if len(collectionUniqueKeys) == 0 {
		return nil
	}

	// collection unique keys will be something like "uesio/tests:dev:rare_and_unusual_object",
	// but the "uesio/studio.collection" field for fields will be something like "uesio/tests.rare_and_unusual_object",
	// so we need to parse this
	targetCollections := []string{}
	for _, collectionUniqueKey := range collectionUniqueKeys {
		targetCollection, err := parseUniquekeyToCollectionKey(collectionUniqueKey)
		if err != nil {
			return err
		}
		targetCollections = append(targetCollections, targetCollection)
	}

	if len(targetCollections) == 0 {
		return nil
	}

	fc := meta.FieldCollection{}
	err := datasource.PlatformLoad(&fc, &datasource.PlatformLoadOptions{
		Fields: []adapt.LoadRequestField{
			{
				ID: "uesio/core.id",
			},
		},
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    "uesio/studio.collection",
				Values:   targetCollections,
				Operator: "IN",
			},
		},
		Connection: connection,
		Params:     request.Params,
	}, session)
	if err != nil {
		return err
	}

	rac := meta.RouteAssignmentCollection{}
	err = datasource.PlatformLoad(&rac, &datasource.PlatformLoadOptions{
		Fields: []adapt.LoadRequestField{
			{
				ID: "uesio/core.id",
			},
		},
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    "uesio/studio.collection",
				Values:   targetCollections,
				Operator: "IN",
			},
		},
		Connection: connection,
		Params:     request.Params,
	}, session)
	if err != nil {
		return err
	}

	requests := []datasource.SaveRequest{}

	if len(fc) > 0 {
		requests = append(requests, datasource.SaveRequest{
			Collection: "uesio/studio.field",
			Wire:       "RunCollectionAfterSaveBot",
			Deletes:    &fc,
			Params:     request.Params,
		})
	}

	if len(rac) > 0 {
		requests = append(requests, datasource.SaveRequest{
			Collection: "uesio/studio.routeassignment",
			Wire:       "RunCollectionAfterSaveBot",
			Deletes:    &rac,
			Params:     request.Params,
		})
	}

	if len(requests) == 0 {
		return nil
	}

	return datasource.SaveWithOptions(requests, session, datasource.GetConnectionSaveOptions(connection))

}
