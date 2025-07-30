package datasource

import (
	"context"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func HandleUpsertLookup(
	ctx context.Context,
	connection wire.Connection,
	op *wire.SaveOp,
	session *sess.Session,
) error {

	op.InsertCount = len(op.Inserts)
	options := op.Options
	skipUpsertQuery := options == nil || !options.Upsert
	if skipUpsertQuery {
		return nil
	}

	idMap := wire.LocatorMap{}
	for _, change := range op.Inserts {

		// For upserts, if you provide the actual unique key we will
		// use that as a higher priority than the constructed unique
		// key to get a match.
		existingKey, err := change.GetFieldAsString(commonfields.UniqueKey)
		if err != nil || existingKey == "" {
			// As a fallback, we'll construct the unique key for you
			constructedKey, err := GetUniqueKeyValue(change)
			if err != nil || constructedKey == "" {
				continue
			}
			existingKey = constructedKey
		}

		err = idMap.AddID(existingKey, wire.ReferenceLocator{
			Item: change,
		})
		if err != nil {
			return err
		}
	}

	if len(idMap) == 0 {
		return nil
	}

	metadata, err := op.GetMetadata()
	if err != nil {
		return err
	}

	return LoadLooper(ctx, connection, op.CollectionName, idMap, []wire.LoadRequestField{
		{
			ID: commonfields.Id,
		},
		{
			ID: commonfields.UniqueKey,
		},
	}, commonfields.UniqueKey, metadata, session, func(item meta.Item, matchIndexes []wire.ReferenceLocator, ID string) error {

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
			return fmt.Errorf("bad lookup: %d", len(matchIndexes))
		}

		match := matchIndexes[0].Item

		// Cast item to a change
		change := match.(*wire.ChangeItem)

		idValue, err := item.GetField(commonfields.Id)
		if err != nil {
			return err
		}
		err = change.SetField(commonfields.Id, idValue)
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
