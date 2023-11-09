package adapt

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

func processLocalReferences(
	op *SaveOp,
	change *ChangeItem,
	uniqueKeyFieldValue string,
	refValue interface{},
	refCollectionMetadata *CollectionMetadata,
) (bool, error) {
	// Special case for allowing self-references
	if op.Metadata.GetFullName() == refCollectionMetadata.GetFullName() {

		baseUniqueKeyValue, err := GetUniqueKeyValue(change)
		if err != nil {
			return false, err
		}

		if baseUniqueKeyValue == uniqueKeyFieldValue {
			concreteItem, err := GetLoadable(refValue)
			if err != nil {
				return false, err
			}
			return true, concreteItem.SetField(ID_FIELD, change.IDValue)
		}
		// As a final Fallback check to see if any of the changes have that id
		foundMatch := false
		err = op.LoopChanges(func(innerChange *ChangeItem) error {

			innerBaseUniqueKeyValue, err := GetUniqueKeyValue(innerChange)
			if err != nil {
				return err
			}

			if innerBaseUniqueKeyValue == uniqueKeyFieldValue {
				foundMatch = true
				concreteItem, err := GetLoadable(refValue)
				if err != nil {
					return err
				}
				return concreteItem.SetField(ID_FIELD, innerChange.IDValue)
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
	connection Connection,
	op *SaveOp,
	session *sess.Session,
) error {

	metadata := connection.GetMetadata()

	referencedIDCollections := ReferenceRegistry{}
	referencedUniqueKeyCollections := ReferenceRegistry{}

	// Load All Reference Fields for Inserts and add to changes
	for i := range op.Metadata.Fields {
		field := op.Metadata.Fields[i]
		if IsReference(field.Type) {
			refCollectionMetadata, err := metadata.GetCollection(field.ReferenceMetadata.Collection)
			if err != nil {
				return err
			}

			refIDReq := referencedIDCollections.Get(field.ReferenceMetadata.Collection)
			refIDReq.Metadata = refCollectionMetadata
			refIDReq.MatchField = ID_FIELD

			refUniqueKeyReq := referencedUniqueKeyCollections.Get(field.ReferenceMetadata.Collection)
			refUniqueKeyReq.Metadata = refCollectionMetadata
			refUniqueKeyReq.MatchField = UNIQUE_KEY_FIELD

			err = op.LoopChanges(func(change *ChangeItem) error {

				refValue, err := change.FieldChanges.GetField(field.GetFullName())
				if err != nil || refValue == nil {
					return nil
				}

				idFieldValue, err := GetFieldValueString(refValue, ID_FIELD)
				if err != nil {
					idFieldValue = ""
				}

				uniqueKeyFieldValue, err := GetFieldValueString(refValue, UNIQUE_KEY_FIELD)
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

					return refIDReq.AddID(idFieldValue, ReferenceLocator{
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

					return refUniqueKeyReq.AddID(uniqueKeyFieldValue, ReferenceLocator{
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
