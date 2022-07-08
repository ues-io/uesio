package adapt

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
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

	keyValue, err := GetFieldValue(value, UNIQUE_KEY_FIELD)
	if err != nil {
		return "", err
	}
	keyString, ok := keyValue.(string)
	if ok {
		return keyString, nil
	}

	return "", fmt.Errorf("Invalid type for key field, %T", value)
}

func SetUniqueKey(item loadable.Item, collectionMetadata *CollectionMetadata) (string, error) {
	// First see if the unique key already exists.
	existingKey, err := item.GetField(UNIQUE_KEY_FIELD)
	if err == nil && existingKey != nil && existingKey != "" {
		return existingKey.(string), nil
	}
	keyFields := collectionMetadata.UniqueKey
	if len(keyFields) == 0 {
		keyFields = []string{ID_FIELD}
	}
	keyValues := make([]string, len(keyFields))
	for i, keyField := range keyFields {
		value, err := GetUniqueKeyPart(item, keyField)
		if err != nil {
			fmt.Println("Failed to get part: " + keyField)
			fmt.Println(fmt.Sprintf("%+v", item))
			fmt.Println(keyFields)
			fmt.Println(collectionMetadata.GetFullName())
			fmt.Println(err)

			return "", err
		}
		if value == "" {
			return "", errors.New("Required Unique Key Value Not Provided: " + collectionMetadata.GetFullName() + " : " + keyField)
		}
		keyValues[i] = value
	}

	uniqueKey := strings.Join(keyValues, ":")

	err = item.SetField(UNIQUE_KEY_FIELD, uniqueKey)
	if err != nil {
		return "", err
	}

	return uniqueKey, nil
}

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

	return LoadLooper(connection, op.CollectionName, idMap, allFields, ID_FIELD, false, func(item loadable.Item, matchIndexes []ReferenceLocator) error {
		if len(matchIndexes) != 1 {
			return errors.New("Bad OldValue Lookup Here: " + strconv.Itoa(len(matchIndexes)))
		}
		match := matchIndexes[0].Item
		// Cast item to a change
		change := match.(*ChangeItem)
		change.OldValues = item

		uniqueKey, err := SetUniqueKey(change, collectionMetadata)
		if err != nil {
			return err
		}

		change.UniqueKey = uniqueKey

		return nil
	})
}
