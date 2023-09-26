package adapt

import (
	"errors"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetUniqueKeyPart(change *ChangeItem, fieldName string) (string, error) {
	value, err := change.GetField(fieldName)
	if err != nil {
		return "", err
	}
	stringValue, ok := value.(string)
	if ok {
		return stringValue, nil
	}
	intValue, ok := value.(int)
	if ok {
		return strconv.Itoa(intValue), nil
	}
	//TO-DO this is an alternataive solution, remove if no needed.
	//It' also a level higher.
	//This fixes the issue but means that we can not use float64 values in our uniquekeys
	//Since the value will be rounded
	// float64Value, ok := value.(float64)
	// if ok {
	// 	return strconv.Itoa(int(float64Value)), nil
	// }
	return GetFieldValueString(value, UNIQUE_KEY_FIELD)
}

func GetUniqueKeyValue(change *ChangeItem) (string, error) {
	keyFields := change.Metadata.UniqueKey
	if len(keyFields) == 0 {
		keyFields = []string{ID_FIELD}
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

func SetUniqueKey(change *ChangeItem) error {
	uniqueKey, err := GetUniqueKeyValue(change)
	if err != nil {
		return err
	}
	change.UniqueKey = uniqueKey
	return change.SetField(UNIQUE_KEY_FIELD, uniqueKey)
}

func HandleOldValuesLookup(
	connection Connection,
	op *SaveOp,
	session *sess.Session,
) error {

	allFields := []LoadRequestField{}

	for fieldID := range op.Metadata.Fields {

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

		fieldMetadata, err := op.Metadata.GetField(fieldID)
		if err != nil {
			return err
		}
		if IsReference(fieldMetadata.Type) {

			isPartOfKey := false

			for _, keypart := range op.Metadata.UniqueKey {
				if keypart == fieldID {
					isPartOfKey = true
					break
				}
			}

			if isPartOfKey {
				allFields = append(allFields, LoadRequestField{
					ID: fieldID,
					Fields: []LoadRequestField{
						{
							ID: UNIQUE_KEY_FIELD,
						},
					},
				})
				continue
			}

		}
		// END TEMPORARY FIX

		allFields = append(allFields, LoadRequestField{
			ID: fieldID,
		})
	}

	// Go through all the changes and get a list of the upsert keys
	idMap := LocatorMap{}
	for _, change := range op.Updates {
		err := idMap.AddID(change.IDValue, ReferenceLocator{
			Item: change,
		})
		if err != nil {
			return err
		}
	}
	for _, change := range op.Deletes {
		err := idMap.AddID(change.IDValue, ReferenceLocator{
			Item: change,
		})
		if err != nil {
			return err
		}
	}

	if len(idMap) == 0 {
		return nil
	}

	return LoadLooper(connection, op.Metadata.GetFullName(), idMap, allFields, ID_FIELD, session, func(item meta.Item, matchIndexes []ReferenceLocator, ID string) error {

		if item == nil {
			// This should result in an error, unless we have explicitly indicated that
			// we do not care if records are missing (which they may be if we are doing a cascade delete
			// and some bot has already deleted them)
			if op.Options != nil && op.Options.IgnoreMissingRecords {
				return nil
			}
			return errors.New("Could not find record to update or delete: " + ID)
		}

		if len(matchIndexes) != 1 {
			return errors.New("Bad OldValue Lookup Here: " + strconv.Itoa(len(matchIndexes)))
		}
		match := matchIndexes[0].Item
		// Cast item to a change
		change := match.(*ChangeItem)
		change.OldValues = item

		return SetUniqueKey(change)

	})
}
