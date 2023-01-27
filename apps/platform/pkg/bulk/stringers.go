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
	// Export TIMESTAMPs in RFC3339/ISO-8601 datetime format
	if fieldMetadata.Type == "TIMESTAMP" {
		timestamp, ok := value.(float64)
		if !ok {
			return "", errors.New("Bad timestamp value")
		}
		sec, dec := math.Modf(timestamp)
		unixTimestamp := time.Unix(int64(sec), int64(dec*(1e9))).UTC()
		return unixTimestamp.Format(time.RFC3339), nil
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
