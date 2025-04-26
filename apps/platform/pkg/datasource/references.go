package datasource

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
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
	metadata *wire.MetadataCache,
	session *sess.Session,
	looper func(meta.Item, []wire.ReferenceLocator, string) error,
) error {
	ids := idMap.GetIDs()
	idLength := len(ids)
	if idLength == 0 {
		return errors.New("no ids provided for load looper")
	}
	var condition wire.LoadRequestCondition
	if idLength == 1 {
		condition = wire.LoadRequestCondition{
			Field: matchField,
			Value: ids[0],
		}
	} else {
		condition = wire.LoadRequestCondition{
			Field:    matchField,
			Operator: "IN",
			Values:   ids,
		}
	}
	op := &wire.LoadOp{
		Fields:         fields,
		WireName:       "LooperLoad",
		Collection:     &wire.Collection{},
		CollectionName: collectionName,
		Conditions: []wire.LoadRequestCondition{
			condition,
		},
		Query: true,
	}

	op.AttachMetadataCache(metadata)

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

type ReferenceOptions struct {
	AllowMissingItems  bool
	RemoveMissingItems bool
	MergeItems         bool
}

func HandleReferences(
	connection wire.Connection,
	referencedCollections wire.ReferenceRegistry,
	metadata *wire.MetadataCache,
	session *sess.Session,
	options *ReferenceOptions,
) error {

	if options == nil {
		options = &ReferenceOptions{}
	}

	for collectionName, ref := range referencedCollections {

		if len(ref.IDMap) == 0 {
			continue
		}

		collectionMetadata, err := metadata.GetCollection(collectionName)
		if err != nil {
			return err
		}

		collectionNameField, err := collectionMetadata.GetNameField()
		if err != nil {
			return err
		}

		refFields := []wire.LoadRequestField{
			{
				ID: commonfields.Id,
			},
			{
				ID: commonfields.UniqueKey,
			},
		}

		if collectionNameField != nil {
			nameFieldID := collectionNameField.GetFullName()
			if nameFieldID != "" && nameFieldID != commonfields.UniqueKey && nameFieldID != commonfields.Id {
				refFields = append(refFields, wire.LoadRequestField{ID: nameFieldID})
			}
		}

		ref.AddFields(refFields)

		err = LoadLooper(connection, collectionName, ref.IDMap, ref.Fields, ref.GetMatchField(), metadata, session, func(refItem meta.Item, matchIndexes []wire.ReferenceLocator, ID string) error {

			// This is a weird situation.
			// It means we found a value that we didn't ask for.
			// refItem will be that strange item.
			if matchIndexes == nil {
				return nil
			}

			// This means we tried to load some references, but they don't exist.
			if refItem == nil {
				if options.RemoveMissingItems {
					// Loop over all matchIndexes and copy the data from the refItem
					for _, locator := range matchIndexes {
						concreteItem := locator.Item.(meta.Item)
						err = concreteItem.SetField(locator.Field.GetFullName(), nil)
						if err != nil {
							return err
						}
					}
					return nil
				}
				if options.AllowMissingItems {
					return nil
				}
				return fmt.Errorf("missing reference item for key: %s on %s -> %s", ID, collectionName, ref.GetMatchField())
			}

			// Loop over all matchIndexes and copy the data from the refItem
			for _, locator := range matchIndexes {
				referenceValue := &wire.Item{}
				concreteItem := locator.Item.(meta.Item)
				err := meta.Copy(referenceValue, refItem)
				if err != nil {
					return err
				}

				if options.MergeItems {
					existingRef, err := concreteItem.GetField(locator.Field.GetFullName())
					// Only continue with merge items if we already have a reference field
					if err == nil && existingRef != nil {
						existingRefItem, err := wire.GetLoadable(existingRef)
						if err != nil {
							return err
						}
						err = referenceValue.Loop(func(fieldName string, value any) error {
							return existingRefItem.SetField(fieldName, value)
						})
						if err != nil {
							return err
						}
						continue
					}
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

func HandleMultiCollectionReferences(
	connection wire.Connection,
	referencedCollections wire.ReferenceRegistry,
	metadata *wire.MetadataCache,
	session *sess.Session,
) error {
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
			ID: commonfields.Id,
		},
		{
			ID: commonfields.UniqueKey,
		},
		{
			ID: commonfields.Collection,
		},
	})

	err := LoadLooper(connection, constant.CommonCollection, common.IDMap, common.Fields, common.GetMatchField(), metadata, session, func(refItem meta.Item, matchIndexes []wire.ReferenceLocator, ID string) error {

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

		collectionName, err := refItem.GetField(commonfields.Collection)
		if err != nil {
			return err
		}

		refID, err := refItem.GetField(commonfields.Id)
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

	return multiCollectionsRefs.Load(metadata, session, nil)
}
