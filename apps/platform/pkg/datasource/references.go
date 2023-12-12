package datasource

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func LoadLooper(
	connection wire.Connection,
	collectionName string,
	idMap wire.LocatorMap,
	fields []wire.LoadRequestField,
	matchField string,
	session *sess.Session,
	looper func(meta.Item, []wire.ReferenceLocator, string) error,
) error {
	ids := idMap.GetIDs()
	if len(ids) == 0 {
		return errors.New("No ids provided for load looper")
	}
	op := &wire.LoadOp{
		Fields:         fields,
		WireName:       "LooperLoad",
		Collection:     &wire.Collection{},
		CollectionName: collectionName,
		Conditions: []wire.LoadRequestCondition{
			{
				Field:    matchField,
				Operator: "IN",
				Values:   ids,
			},
		},
		Query: true,
	}

	err := connection.Load(op, session)
	if err != nil {
		return err
	}

	err = op.Collection.Loop(func(refItem meta.Item, _ string) error {
		refFK, err := refItem.GetField(matchField)
		if err != nil {
			return err
		}

		refFKAsString, ok := refFK.(string)
		if !ok {
			//Was unable to convert foreign key to a string!
			//Something has gone sideways!
			return err
		}

		matchIndexes, ok := idMap[refFKAsString]
		if !ok {
			return looper(refItem, nil, refFKAsString)
		}
		// Remove the id from the map, so we can figure out which ones weren't used
		delete(idMap, refFKAsString)
		return looper(refItem, matchIndexes, refFKAsString)
	})
	if err != nil {
		return err
	}
	// If we still have values in our idMap, then we didn't find some of our references.
	for id, locator := range idMap {
		return looper(nil, locator, id)
	}
	return nil

}

func HandleReferences(
	connection wire.Connection,
	referencedCollections wire.ReferenceRegistry,
	session *sess.Session,
	allowMissingItems bool,
) error {

	for collectionName, ref := range referencedCollections {

		if len(ref.IDMap) == 0 {
			continue
		}

		ref.AddFields([]wire.LoadRequestField{
			{
				ID: wire.ID_FIELD,
			},
			{
				ID: wire.UNIQUE_KEY_FIELD,
			},
		})

		err := LoadLooper(connection, collectionName, ref.IDMap, ref.Fields, ref.GetMatchField(), session, func(refItem meta.Item, matchIndexes []wire.ReferenceLocator, ID string) error {

			// This is a weird situation.
			// It means we found a value that we didn't ask for.
			// refItem will be that strange item.
			if matchIndexes == nil {
				return nil
			}

			// This means we tried to load some references, but they don't exist.
			if refItem == nil {
				if allowMissingItems {
					return nil
				}
				return fmt.Errorf("Missing Reference Item For Key: %s on %s -> %s", ID, collectionName, ref.GetMatchField())
			}

			// Loop over all matchIndexes and copy the data from the refItem
			for _, locator := range matchIndexes {
				referenceValue := &wire.Item{}
				concreteItem := locator.Item.(meta.Item)
				err := meta.Copy(referenceValue, refItem)
				if err != nil {
					return err
				}
				err = concreteItem.SetField(locator.Field.GetFullName(), referenceValue)
				if err != nil {
					return err
				}
			}
			return nil
		})
		if err != nil {
			return err
		}
	}

	return nil
}

func HandleMultiCollectionReferences(connection wire.Connection, referencedCollections wire.ReferenceRegistry,
	session *sess.Session) error {
	// 1. Check the map to see if the common collection is present
	common, ok := referencedCollections[constant.CommonCollection]
	if !ok {
		return nil
	}

	delete(referencedCollections, constant.CommonCollection)

	if len(common.IDMap) == 0 {
		return nil
	}

	common.AddFields([]wire.LoadRequestField{
		{
			ID: wire.ID_FIELD,
		},
		{
			ID: wire.UNIQUE_KEY_FIELD,
		},
		{
			ID: wire.COLLECTION_FIELD,
		},
	})

	err := LoadLooper(connection, constant.CommonCollection, common.IDMap, common.Fields, common.GetMatchField(), session, func(refItem meta.Item, matchIndexes []wire.ReferenceLocator, ID string) error {

		// This is a weird situation.
		// It means we found a value that we didn't ask for.
		// refItem will be that strange item.
		if matchIndexes == nil {
			return nil
		}

		// This means we tried to load some references, but they don't exist.
		if refItem == nil {
			return nil
		}

		collectionName, err := refItem.GetField("uesio/core.collection")
		if err != nil {
			return err
		}

		refID, err := refItem.GetField("uesio/core.id")
		if err != nil {
			return err
		}

		refRequest := referencedCollections.Get(collectionName.(string))
		refRequest.AddFields(common.Fields)
		// Loop over all matchIndexes and copy the data from the refItem
		for _, locator := range matchIndexes {
			err := refRequest.AddID(refID.(string), locator)
			if err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return err
	}

	//LOAD the metadata for the referenced collections
	multiCollectionsRefs := MetadataRequest{}
	for collectionName := range referencedCollections {
		multiCollectionsRefs.AddCollection(collectionName)
		for _, key := range BUILTIN_FIELD_KEYS {
			multiCollectionsRefs.AddField(collectionName, key, nil)
		}
	}

	return multiCollectionsRefs.Load(connection.GetMetadata(), session, nil)
}
