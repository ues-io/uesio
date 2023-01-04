package bulk

import (
	"errors"
	"fmt"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func getStringValue(fieldMetadata *adapt.FieldMetadata, value interface{}) (string, error) {

	if adapt.IsReference(fieldMetadata.Type) {
		return adapt.GetReferenceKey(value)
	}
	if fieldMetadata.Type == "TIMESTAMP" {
		timestamp, ok := value.(int64)
		if !ok {
			return "", errors.New("Bad timestamp value")
		}
		tm := time.Unix(timestamp, 0)
		return tm.String(), nil
	}
	if fieldMetadata.Type == "NUMBER" {
		return fmt.Sprintf("%v", value), nil
	}
	stringVal, ok := value.(string)
	if !ok {
		fmt.Println("Failed to set: " + fieldMetadata.GetFullName() + ":" + fieldMetadata.Type)
		stringVal = ""
	}
	return stringVal, nil
}
