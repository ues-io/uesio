package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/templating"
)

func HandleReferenceLookups(
	connection Connection,
	op *SaveOp,
) error {

	metadata := connection.GetMetadata()
	options := op.Options
	if options == nil {
		return nil
	}

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	referencedCollections := ReferenceRegistry{}

	for _, lookup := range op.Options.Lookups {

		fieldMetadata, err := collectionMetadata.GetField(lookup.RefField)
		if err != nil {
			return err
		}

		if fieldMetadata.Type != "REFERENCE" {
			return errors.New("Can only lookup on reference field: " + lookup.RefField)
		}

		refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
		if err != nil {
			return err
		}

		matchField := GetStringWithDefault(lookup.MatchField, ID_FIELD)
		matchTemplate := GetStringWithDefault(lookup.MatchTemplate, refCollectionMetadata.IDFormat)

		template, err := NewFieldChanges(matchTemplate, refCollectionMetadata)
		if err != nil {
			return err
		}

		if template == nil {
			return errors.New("Cannot get reference op without id format metadata")
		}

		refReq := referencedCollections.Get(fieldMetadata.ReferenceMetadata.Collection)
		refReq.Metadata = refCollectionMetadata
		refReq.MatchField = matchField

		refReq.AddFields([]LoadRequestField{
			{
				ID: matchField,
			},
		})

		op.LoopChanges(func(change *ChangeItem) error {
			matchKeyValue, err := change.FieldChanges.GetField(lookup.RefField)
			if err != nil {
				return nil
			}

			matchKeyValueItem := Item(matchKeyValue.(map[string]interface{}))

			// check to see if this item already has its id field set.
			// if so, we can just skip checking for it.
			idFieldValue, err := matchKeyValueItem.GetField(ID_FIELD)
			if err == nil && idFieldValue != "" {
				return nil
			}

			referenceKeyValue, err := templating.Execute(template, &matchKeyValueItem)
			if err != nil {
				return err
			}

			if referenceKeyValue == "" {
				return nil
			}

			refReq.AddID(referenceKeyValue, ReferenceLocator{
				Item:  change,
				Field: fieldMetadata,
			})

			return nil
		})

	}

	return HandleReferences(connection, referencedCollections)
}
