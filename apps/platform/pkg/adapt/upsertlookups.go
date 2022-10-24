package adapt

import (
	"errors"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func HandleUpsertLookup(
	connection Connection,
	op *SaveOp,
	session *sess.Session,
) error {

	op.InsertCount = len(op.Inserts)
	options := op.Options
	skipUpsertQuery := options == nil || !options.Upsert
	if skipUpsertQuery {
		return nil
	}

	idMap := LocatorMap{}
	for _, change := range op.Inserts {

		// It's ok to not handle this error here, because we'll try to
		// set the unique key again later when we have more data.
		_ = SetUniqueKey(change)

		if change.UniqueKey == "" {
			continue
		}

		err := idMap.AddID(change.UniqueKey, ReferenceLocator{
			Item: change,
		})
		if err != nil {
			return err
		}
	}

	if len(idMap) == 0 {
		return nil
	}

	return LoadLooper(connection, op.Metadata.GetFullName(), idMap, []LoadRequestField{
		{
			ID: ID_FIELD,
		},
		{
			ID: UNIQUE_KEY_FIELD,
		},
	}, UNIQUE_KEY_FIELD, session, func(item meta.Item, matchIndexes []ReferenceLocator, ID string) error {

		// This is a weird situation.
		// It means we found a value that we didn't ask for.
		// refItem will be that strange item.
		if matchIndexes == nil {
			return nil
		}

		// We didn't find our item to upsert sad.
		if item == nil {
			return nil
		}

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
