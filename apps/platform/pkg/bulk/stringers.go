package bulk

import (
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func getStringValue(fieldMetadata *adapt.FieldMetadata, value interface{}) (string, error) {

	if adapt.IsReference(fieldMetadata.Type) {
		return adapt.GetReferenceKey(value)
	}
	if fieldMetadata.Type == "TIMESTAMP" {
		timestamp, ok := value.(float64)
		if !ok {
			return "", errors.New("Bad timestamp value")
		}
		sec, dec := math.Modf(timestamp)
		tm := time.Unix(int64(sec), int64(dec*(1e9)))
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
