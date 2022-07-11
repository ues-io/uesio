package adapt

import (
	"errors"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

func HandleUpsertLookup(
	connection Connection,
	op *SaveOp,
) error {

	op.InsertCount = len(op.Inserts)
	metadata := connection.GetMetadata()
	options := op.Options
	skipUpsertQuery := options == nil || !options.Upsert
	if skipUpsertQuery {
		return nil
	}

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	idMap := LocatorMap{}
	for _, change := range op.Inserts {
		// Actually set the unique Keys here for inserts
		uniqueKey, err := SetUniqueKey(change, collectionMetadata)
		if err != nil {
			return err
		}

		change.UniqueKey = uniqueKey

		idMap.AddID(change.UniqueKey, ReferenceLocator{
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
			ID: UNIQUE_KEY_FIELD,
		},
	}, UNIQUE_KEY_FIELD, false, func(item loadable.Item, matchIndexes []ReferenceLocator) error {

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
