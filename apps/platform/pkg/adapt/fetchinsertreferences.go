package adapt

import (
	"errors"
)

func FetchInsertReferences(
	connection Connection,
	op *SaveOp,
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

			refIDReq.AddFields([]LoadRequestField{
				{
					ID: UNIQUE_KEY_FIELD,
				},
			})

			refUniqueKeyReq.AddFields([]LoadRequestField{
				{
					ID: UNIQUE_KEY_FIELD,
				},
			})

			err = op.LoopChanges(func(change *ChangeItem) error {

				refValue, err := change.FieldChanges.GetField(field.GetFullName())
				if err != nil {
					return nil
				}

				if refValue == nil {
					return nil
				}

				idFieldValue, err := GetFieldValue(refValue, ID_FIELD)
				if err == nil && idFieldValue != "" {
					refIDReq.AddID(idFieldValue, ReferenceLocator{
						Item:  change,
						Field: field,
					})
					return nil
				}

				uniqueKeyFieldValue, err := GetFieldValue(refValue, UNIQUE_KEY_FIELD)
				if err == nil && uniqueKeyFieldValue != "" {
					refUniqueKeyReq.AddID(uniqueKeyFieldValue, ReferenceLocator{
						Item:  change,
						Field: field,
					})
					return nil
				}

				return errors.New("There was a problem here!!! Missing id or unique key")
			})
			if err != nil {
				return err
			}

		}
	}

	err = HandleReferences(connection, referencedIDCollections, false)
	if err != nil {
		return err
	}

	return HandleReferences(connection, referencedUniqueKeyCollections, false)

}
