package adapt

import (
	"errors"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetUniqueKeyPart(item meta.Item, fieldName string) (string, error) {
	value, err := GetFieldValue(item, fieldName)
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
