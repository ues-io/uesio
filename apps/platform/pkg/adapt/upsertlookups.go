package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/templating"
)

func HandleUpsertLookup(
	loader Loader,
	op *SaveOp,
	metadata *MetadataCache,
) error {

	options := op.Options
	if options == nil || options.Upsert == nil {
		return nil
	}

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	// If we have a match field option, use that, otherwise, use the name field
	upsertKey := getStringWithDefault(options.Upsert.MatchField, ID_FIELD)
	matchTemplate := getStringWithDefault(options.Upsert.MatchTemplate, collectionMetadata.IDFormat)

	template, err := NewFieldChanges(matchTemplate, collectionMetadata)
	if err != nil {
		return err
	}

	// Go through all the changes and get a list of the upsert keys
	ids := []string{}
	for _, change := range *op.Inserts {
		upsertKeyStringValue, err := templating.Execute(template, change.FieldChanges)
		if err != nil {
			continue
		}

		if upsertKeyStringValue == "" {
			continue
		}
		ids = append(ids, upsertKeyStringValue)
	}

	if len(ids) == 0 {
		return nil
	}

	loadOp := &LoadOp{
		CollectionName: op.CollectionName,
		WireName:       op.WireName,
		Fields: []LoadRequestField{
			{
				ID: ID_FIELD,
			},
			{
				ID: upsertKey,
			},
		},
		Collection: &Collection{},
		Conditions: []LoadRequestCondition{
			{
				Field:    upsertKey,
				Operator: "IN",
				Value:    ids,
			},
		},
		Query: true,
	}

	err = loader([]*LoadOp{loadOp})
	if err != nil {
		return err
	}

	lookupResult, err := getLookupResultMap(loadOp, upsertKey)
	if err != nil {
		return err
	}

	template, err = NewFieldChanges(matchTemplate, collectionMetadata)
	if err != nil {
		return err
	}

	if template == nil {
		return errors.New("Cannot upsert without id format metadata")
	}

	newInserts := ChangeItems{}
	for _, change := range *op.Inserts {

		keyVal, err := templating.Execute(template, change.FieldChanges)
		if err != nil || keyVal == "" {
			return errors.New("Could not get key for upsert change: " + err.Error() + " : " + keyVal)
		}
		match, ok := lookupResult[keyVal]

		// If we find a match, populate the id field so that it's an update instead of an insert
		if ok {
			idValue, err := match.GetField(ID_FIELD)
			if err != nil {
				return err
			}
			err = change.FieldChanges.SetField(ID_FIELD, idValue)
			if err != nil {
				return err
			}
			change.IDValue = idValue.(string)
			*op.Updates = append(*op.Updates, change)
		} else {
			newInserts = append(newInserts, change)
		}

	}
	*op.Inserts = newInserts
	return nil

}
