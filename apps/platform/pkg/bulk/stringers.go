package bulk

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"sort"
	"time"

	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func getStringValue(fieldMetadata *wire.FieldMetadata, value any) (string, error) {

	// Handle all nils as empty string
	if value == nil {
		return "", nil
	}
	if wire.IsReference(fieldMetadata.Type) {
		return wire.GetReferenceKey(value)
	}
	switch fieldMetadata.Type {
	case "LIST", "STRUCT", "MAP":
		byteValue, err := json.Marshal(value)
		if err != nil {
			return "", fmt.Errorf("Failed to serialize: %s: %w", fieldMetadata.GetFullName(), err)
		}
		return string(byteValue), nil
	case "MULTISELECT":
		// Multi-select fields are stored in DB as map[string]bool
		// To be concise, but also allow for nested commas/quotes within the Multiselect value,
		// we serialize to a JSON array
		values := goutils.MapKeys(value.(map[string]any))
		sort.Strings(values)
		byteValue, err := json.Marshal(values)
		if err != nil {
			return "", fmt.Errorf("Failed to serialize: %s: %w", fieldMetadata.GetFullName(), err)
		}
		return string(byteValue), nil
	case "TIMESTAMP":
		// Export TIMESTAMPs in RFC3339/ISO-8601 datetime format
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
	case "NUMBER":
		return fmt.Sprintf("%v", value), nil
	case "CHECKBOX":
		if value == true {
			return "true", nil
		}
		return "false", nil
	default:
		stringVal, ok := value.(string)
		if !ok {
			fmt.Println("Failed to set: " + fieldMetadata.GetFullName() + ":" + fieldMetadata.Type)
			stringVal = ""
		}
		return stringVal, nil
	}
}
