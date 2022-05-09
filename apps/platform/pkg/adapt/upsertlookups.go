package adapt

import (
	"errors"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func HandleUpsertLookup(
	connection Connection,
	op *SaveOp,
) error {

	op.InsertCount = len(op.Inserts)

	options := op.Options
	if options == nil || options.Upsert == nil {
		return nil
	}

	metadata := connection.GetMetadata()

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	// If we have a match field option, use that, otherwise, use the name field
	upsertKey := GetStringWithDefault(options.Upsert.MatchField, ID_FIELD)
	matchTemplate := GetStringWithDefault(options.Upsert.MatchTemplate, collectionMetadata.IDFormat)

	template, err := NewFieldChanges(matchTemplate, collectionMetadata)
	if err != nil {
		return err
	}

	// Go through all the changes and get a list of the upsert keys
	idMap := LocatorMap{}
	for _, change := range op.Inserts {
		upsertKeyStringValue, err := templating.Execute(template, change.FieldChanges)
		if err != nil {
			continue
		}

		if upsertKeyStringValue == "" {
			continue
		}

		idMap.AddID(upsertKeyStringValue, ReferenceLocator{
			Item: change,
		})

	}

	if len(idMap) == 0 {
		return nil
	}

	return LoadLooper(connection, op.CollectionName, idMap, []LoadRequestField{
		{
			ID: ID_FIELD,
		},
		{
			ID: upsertKey,
		},
	}, upsertKey, func(item loadable.Item, matchIndexes []ReferenceLocator) error {

		if len(matchIndexes) != 1 {
			return errors.New("Bad Lookup Here: " + strconv.Itoa(len(matchIndexes)))
		}

		match := matchIndexes[0].Item

		// Cast item to a change
		change := match.(*ChangeItem)

		idValue, err := item.GetField(ID_FIELD)
		if err != nil {
			return err
		}
		err = change.SetField(ID_FIELD, idValue)
		if err != nil {
			return err
		}

		change.IDValue = idValue.(string)
		change.IsNew = false
		op.Updates = append(op.Updates, change)
		op.InsertCount = op.InsertCount - 1

		return nil
	})

}
