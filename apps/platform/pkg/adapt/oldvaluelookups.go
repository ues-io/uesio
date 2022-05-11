package adapt

import (
	"errors"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

func HandleOldValuesLookup(
	connection Connection,
	op *SaveOp,
) error {
	metadata := connection.GetMetadata()
	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	allFields := []LoadRequestField{}

	for fieldID := range collectionMetadata.Fields {
		allFields = append(allFields, LoadRequestField{
			ID: fieldID,
		})
	}

	// Go through all the changes and get a list of the upsert keys
	idMap := LocatorMap{}
	for _, change := range op.Updates {
		idMap.AddID(change.IDValue, ReferenceLocator{
			Item: change,
		})
	}
	for _, change := range op.Deletes {
		idMap.AddID(change.IDValue, ReferenceLocator{
			Item: change,
		})
	}

	if len(idMap) == 0 {
		return nil
	}

	return LoadLooper(connection, op.CollectionName, idMap, allFields, ID_FIELD, func(item loadable.Item, matchIndexes []ReferenceLocator) error {
		if len(matchIndexes) != 1 {
			return errors.New("Bad OldValue Lookup Here: " + strconv.Itoa(len(matchIndexes)))
		}
		match := matchIndexes[0].Item
		// Cast item to a change
		change := match.(*ChangeItem)
		change.OldValues = item
		return nil
	})
}
