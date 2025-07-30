package datasource

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"slices"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func GetUniqueKeyPart(change *wire.ChangeItem, fieldName string) (string, error) {
	fieldMetadata, err := change.Metadata.GetField(fieldName)
	if err != nil {
		return "", err
	}
	value, err := change.GetField(fieldName)
	if err != nil {
		return "", err
	}
	if wire.IsReference(fieldMetadata.Type) {
		return wire.GetFieldValueString(value, commonfields.UniqueKey)
	}
	if fieldMetadata.Type == "NUMBER" {
		intValue, err := wire.GetValueInt(value)
		if err != nil {
			return "", err
		}
		return strconv.FormatInt(intValue, 10), nil
	}
	return wire.GetValueString(value)

}

func GetUniqueKeyValue(change *wire.ChangeItem) (string, error) {
	keyFields := change.Metadata.UniqueKey
	if len(keyFields) == 0 {
		keyFields = []string{commonfields.Id}
	}
	keyValues := make([]string, len(keyFields))
	for i, keyField := range keyFields {
		value, err := GetUniqueKeyPart(change, keyField)
		if err != nil {
			// If we can't get field data here, just use an empty string
			value = ""
		}
		keyValues[i] = value
	}
	return strings.Join(keyValues, ":"), nil
}

func SetUniqueKey(change *wire.ChangeItem) error {
	uniqueKey, err := GetUniqueKeyValue(change)
	if err != nil {
		return err
	}
	change.UniqueKey = uniqueKey
	return change.SetField(commonfields.UniqueKey, uniqueKey)
}

func HandleOldValuesLookup(
	ctx context.Context,
	connection wire.Connection,
	op *wire.SaveOp,
	session *sess.Session,
) error {

	allFields := []wire.LoadRequestField{}

	metadata, err := op.GetMetadata()
	if err != nil {
		return err
	}

	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return err
	}

	for fieldID := range collectionMetadata.Fields {

		// TEMPORARY FIX:
		// Currently we allow unique keys to contain pieces of reference fields, e.g.
		// View’s Unique Key is: [workspace.app, workspace.name, name]
		// “ben/jobs:dev:jobs”
		// Where workspace.app = “ben/jobs”, workspace.name = “dev”, view = “jobs”
		// (1) If the fields on the reference record (e.g. ‘workspace’) are changed — we
		// don’t go update the unique key of Views, so we have inconsistent unique keys
		// (2) When upserting the main record (e.g. a view), if we were to change either
		// the workspace or the name of the view, but not BOTH, we would need to go
		// lookup the other fields in order to reconstruct the unique key properly.

		// PROPOSED LONG TERM FIX:
		// Only allow level 1 fields to be in a unique key. E.g. we could store the
		// stable id of the reference field (e.g. workspace id) but NOT any fields ON
		// the workspace (e.g. workspace name, workspace app would NOT be allowed to be
		// stored / used in the unique key for View)

		fieldMetadata, err := collectionMetadata.GetField(fieldID)
		if err != nil {
			return err
		}
		if wire.IsReference(fieldMetadata.Type) {

			isPartOfKey := slices.Contains(collectionMetadata.UniqueKey, fieldID)

			if isPartOfKey {
				allFields = append(allFields, wire.LoadRequestField{
					ID: fieldID,
					Fields: []wire.LoadRequestField{
						{
							ID: commonfields.UniqueKey,
						},
					},
				})
				continue
			}

		}
		// END TEMPORARY FIX

		if fieldMetadata.Type == "REFERENCEGROUP" {
			continue
		}

		allFields = append(allFields, wire.LoadRequestField{
			ID: fieldID,
		})
	}

	// Go through all the changes and get a list of the upsert keys
	idMap := wire.LocatorMap{}
	for _, change := range op.Updates {
		err := idMap.AddID(change.IDValue, wire.ReferenceLocator{
			Item: change,
		})
		if err != nil {
			return err
		}
	}
	for _, change := range op.Deletes {
		err := idMap.AddID(change.IDValue, wire.ReferenceLocator{
			Item: change,
		})
		if err != nil {
			return err
		}
	}

	if len(idMap) == 0 {
		return nil
	}

	return LoadLooper(ctx, connection, op.CollectionName, idMap, allFields, commonfields.Id, metadata, session, func(item meta.Item, matchIndexes []wire.ReferenceLocator, ID string) error {

		if item == nil {
			// This should result in an error, unless we have explicitly indicated that
			// we do not care if records are missing (which they may be if we are doing a cascade delete
			// and some bot has already deleted them)
			if op.Options != nil && op.Options.IgnoreMissingRecords {
				return nil
			}
			return fmt.Errorf("could not find record to update or delete: %s", ID)
		}

		if len(matchIndexes) == 0 {
			return fmt.Errorf("bad oldvalue lookup: %d", len(matchIndexes))
		}

		for _, matchIndex := range matchIndexes {
			match := matchIndex.Item
			change := match.(*wire.ChangeItem)
			change.OldValues = item
			err := SetUniqueKey(change)
			if err != nil {
				return err
			}
		}
		return nil

	})
}
