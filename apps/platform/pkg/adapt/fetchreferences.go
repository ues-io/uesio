package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func FetchReferences(
	connection Connection,
	op *SaveOp,
	session *sess.Session,
) error {

	metadata := connection.GetMetadata()

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	referencedIDCollections := ReferenceRegistry{}
	referencedUniqueKeyCollections := ReferenceRegistry{}

	// Load All Reference Fields for Inserts add add to changes
	for i := range collectionMetadata.Fields {
		field := collectionMetadata.Fields[i]
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
					return refIDReq.AddID(idFieldValue, ReferenceLocator{
						Item:  change,
						Field: field,
					})
				}

				if uniqueKeyFieldValue != "" {

					// Special case for allowing self-references
					if change.IsNew && collectionMetadata.GetFullName() == refCollectionMetadata.GetFullName() {
						if change.UniqueKey == uniqueKeyFieldValue {
							concreteItem := refValue.(loadable.Item)
							return concreteItem.SetField(ID_FIELD, change.IDValue)
						}
					}

					return refUniqueKeyReq.AddID(uniqueKeyFieldValue, ReferenceLocator{
						Item:  change,
						Field: field,
					})
				}

				return errors.New("There was a problem here!!! Missing id or unique key")
			})
			if err != nil {
				return err
			}

		}
	}

	err = HandleReferences(connection, referencedIDCollections, session, false)
	if err != nil {
		return err
	}

	return HandleReferences(connection, referencedUniqueKeyCollections, session, false)

}
