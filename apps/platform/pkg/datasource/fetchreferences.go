package datasource

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/constant"
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
	if op.Metadata.GetFullName() == refCollectionMetadata.GetFullName() {

		baseUniqueKeyValue, err := GetUniqueKeyValue(change)
		if err != nil {
			return false, err
		}

		if baseUniqueKeyValue == uniqueKeyFieldValue {
			concreteItem, err := wire.GetLoadable(refValue)
			if err != nil {
				return false, err
			}
			return true, concreteItem.SetField(wire.ID_FIELD, change.IDValue)
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
				return concreteItem.SetField(wire.ID_FIELD, innerChange.IDValue)
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

	metadata := connection.GetMetadata()

	referencedIDCollections := wire.ReferenceRegistry{}
	referencedUniqueKeyCollections := wire.ReferenceRegistry{}

	// Load All Reference Fields for Inserts and add to changes
	for i := range op.Metadata.Fields {
		field := op.Metadata.Fields[i]
		if wire.IsReference(field.Type) {

			referencedCollection := field.ReferenceMetadata.Collection
			if field.ReferenceMetadata.MultiCollection {
				referencedCollection = constant.CommonCollection
			}

			refCollectionMetadata, err := metadata.GetCollection(referencedCollection)
			if err != nil {
				return err
			}

			refIDReq := referencedIDCollections.Get(referencedCollection)
			refIDReq.Metadata = refCollectionMetadata
			refIDReq.MatchField = wire.ID_FIELD

			refUniqueKeyReq := referencedUniqueKeyCollections.Get(referencedCollection)
			refUniqueKeyReq.Metadata = refCollectionMetadata
			refUniqueKeyReq.MatchField = wire.UNIQUE_KEY_FIELD

			err = op.LoopChanges(func(change *wire.ChangeItem) error {

				refValue, err := change.FieldChanges.GetField(field.GetFullName())
				if err != nil || refValue == nil {
					return nil
				}

				idFieldValue, err := wire.GetFieldValueString(refValue, wire.ID_FIELD)
				if err != nil {
					idFieldValue = ""
				}

				uniqueKeyFieldValue, err := wire.GetFieldValueString(refValue, wire.UNIQUE_KEY_FIELD)
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
						Item:  change,
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
						Item:  change,
						Field: field,
					})
				}

				return fmt.Errorf("There was a problem getting reference info on field: %s in collection: %s", field.GetFullName(), op.Metadata.GetFullName())

			})
			if err != nil {
				return err
			}

		}
	}

	err := HandleReferences(connection, referencedIDCollections, session, false)
	if err != nil {
		return err
	}

	return HandleReferences(connection, referencedUniqueKeyCollections, session, false)

}
