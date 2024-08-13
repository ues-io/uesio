package datasource

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func processLocalReferences(
	op *wire.SaveOp,
	change *wire.ChangeItem,
	uniqueKeyFieldValue string,
	refValue interface{},
	refCollectionMetadata *wire.CollectionMetadata,
) (bool, error) {

	// Special case for allowing self-references
	if op.CollectionName == refCollectionMetadata.GetFullName() {

		baseUniqueKeyValue, err := GetUniqueKeyValue(change)
		if err != nil {
			return false, err
		}

		if baseUniqueKeyValue == uniqueKeyFieldValue {
			concreteItem, err := wire.GetLoadable(refValue)
			if err != nil {
				return false, err
			}
			return true, concreteItem.SetField(commonfields.Id, change.IDValue)
		}
		// As a final Fallback check to see if any of the changes have that id
		foundMatch := false
		err = op.LoopChanges(func(innerChange *wire.ChangeItem) error {

			innerBaseUniqueKeyValue, err := GetUniqueKeyValue(innerChange)
			if err != nil {
				return err
			}

			if innerBaseUniqueKeyValue == uniqueKeyFieldValue {
				foundMatch = true
				concreteItem, err := wire.GetLoadable(refValue)
				if err != nil {
					return err
				}
				return concreteItem.SetField(commonfields.Id, innerChange.IDValue)
			}
			return nil
		})
		if err != nil {
			return false, err
		}
		if foundMatch {
			return true, nil
		}
		return false, nil
	}
	return false, nil
}

func FetchReferences(
	connection wire.Connection,
	op *wire.SaveOp,
	session *sess.Session,
) error {

	metadata, err := op.GetMetadata()
	if err != nil {
		return err
	}

	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return err
	}

	referencedIDCollections := wire.ReferenceRegistry{}
	referencedUniqueKeyCollections := wire.ReferenceRegistry{}

	// Load All Reference Fields for Inserts and add to changes
	for i := range collectionMetadata.Fields {
		field := collectionMetadata.Fields[i]
		if wire.IsReference(field.Type) {

			referencedCollection := field.ReferenceMetadata.GetCollection()
			refCollectionMetadata, err := metadata.GetCollection(referencedCollection)
			if err != nil {
				return err
			}

			refIDReq := referencedIDCollections.Get(referencedCollection)
			refIDReq.Metadata = refCollectionMetadata
			refIDReq.MatchField = commonfields.Id

			refUniqueKeyReq := referencedUniqueKeyCollections.Get(referencedCollection)
			refUniqueKeyReq.Metadata = refCollectionMetadata
			refUniqueKeyReq.MatchField = commonfields.UniqueKey

			err = op.LoopChanges(func(change *wire.ChangeItem) error {

				refValue, err := change.FieldChanges.GetField(field.GetFullName())
				if err != nil || refValue == nil {
					return nil
				}

				idFieldValue, err := wire.GetFieldValueString(refValue, commonfields.Id)
				if err != nil {
					idFieldValue = ""
				}

				uniqueKeyFieldValue, err := wire.GetFieldValueString(refValue, commonfields.UniqueKey)
				if err != nil {
					uniqueKeyFieldValue = ""
				}

				if idFieldValue != "" {

					foundMatch, err := processLocalReferences(op, change, uniqueKeyFieldValue, refValue, refCollectionMetadata)
					if err != nil {
						return err
					}
					if foundMatch {
						return nil
					}

					return refIDReq.AddID(idFieldValue, wire.ReferenceLocator{
						Item:  change.FieldChanges,
						Field: field,
					})
				}

				if uniqueKeyFieldValue != "" {

					foundMatch, err := processLocalReferences(op, change, uniqueKeyFieldValue, refValue, refCollectionMetadata)
					if err != nil {
						return err
					}
					if foundMatch {
						return nil
					}

					return refUniqueKeyReq.AddID(uniqueKeyFieldValue, wire.ReferenceLocator{
						Item:  change.FieldChanges,
						Field: field,
					})
				}

				return fmt.Errorf("There was a problem getting reference info on field: %s in collection: %s", field.GetFullName(), op.CollectionName)

			})
			if err != nil {
				return err
			}

		}
	}

	err = HandleReferences(connection, referencedIDCollections, metadata, session, &ReferenceOptions{
		MergeItems: true,
	})
	if err != nil {
		return err
	}

	return HandleReferences(connection, referencedUniqueKeyCollections, metadata, session, &ReferenceOptions{
		MergeItems: true,
	})

}
