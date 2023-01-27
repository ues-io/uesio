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
		// Depending on how the timestamp was created, it may be a float64 or int64,
		// so we need to handle both cases
		var unixTimestamp time.Time
		if timestampFloat, isFloat := value.(float64); isFloat {
			sec, dec := math.Modf(timestampFloat)
			unixTimestamp = time.Unix(int64(sec), int64(dec*(1e9))).UTC()
		} else if timestampInt, isInt := value.(int64); isInt {
			unixTimestamp = time.Unix(timestampInt, 0).UTC()
		} else {
			// It is neither -- this is not a supported format
			return "", errors.New("Bad timestamp value")
		}
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
