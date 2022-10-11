package adapt

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetUniqueKeyPart(item loadable.Item, fieldName string) (string, error) {
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

func SetUniqueKey(change *ChangeItem, collectionMetadata *CollectionMetadata) error {
	if change.UniqueKey != "" {
		return nil
	}
	// First see if the unique key already exists.
	existingKey, err := change.GetFieldAsString(UNIQUE_KEY_FIELD)
	if err == nil && existingKey != "" {
		change.UniqueKey = existingKey
		return nil
	}
	keyFields := collectionMetadata.UniqueKey
	if len(keyFields) == 0 {
		keyFields = []string{ID_FIELD}
	}
	keyValues := make([]string, len(keyFields))
	for i, keyField := range keyFields {
		value, err := GetUniqueKeyPart(change, keyField)
		if err != nil {
			return fmt.Errorf("Failed to get part: %v : %+v : %v : %v : %v", keyField, change, keyFields, collectionMetadata.GetFullName(), err)
		}
		if value == "" {
			return fmt.Errorf("Required Unique Key Value Not Provided: %v : %v", collectionMetadata.GetFullName(), keyField)
		}
		keyValues[i] = value
	}

	uniqueKey := strings.Join(keyValues, ":")

	err = change.SetField(UNIQUE_KEY_FIELD, uniqueKey)
	if err != nil {
		return err
	}

	change.UniqueKey = uniqueKey

	return nil
}

func HandleOldValuesLookup(
	connection Connection,
	op *SaveOp,
	session *sess.Session,
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

	return LoadLooper(connection, op.CollectionName, idMap, allFields, ID_FIELD, session, func(item loadable.Item, matchIndexes []ReferenceLocator, ID string) error {
		if len(matchIndexes) != 1 {
			return errors.New("Bad OldValue Lookup Here: " + strconv.Itoa(len(matchIndexes)))
		}
		match := matchIndexes[0].Item
		// Cast item to a change
		change := match.(*ChangeItem)
		change.OldValues = item

		return SetUniqueKey(change, collectionMetadata)

	})
}
