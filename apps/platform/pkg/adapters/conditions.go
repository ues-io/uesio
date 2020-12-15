package adapters

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// GetConditionValue function
func GetConditionValue(
	condition reqs.LoadRequestCondition,
	wire reqs.LoadRequest,
	metadata *MetadataCache,
	requests []reqs.LoadRequest,
	responses []reqs.LoadResponse,
) (interface{}, error) {
	var conditionValue interface{}
	if condition.ValueSource == "LOOKUP" && condition.LookupWire != "" && condition.LookupField != "" {

		lookupResponse, err := reqs.GetResponseByWireName(responses, condition.LookupWire)
		if err != nil {
			return nil, err
		}

		lookupRequest, err := reqs.GetRequestByWireName(requests, condition.LookupWire)
		if err != nil {
			return nil, err
		}

		if len(lookupResponse.Data) != 1 {
			return nil, errors.New("Must lookup on wires with only one record")
		}

		lookupCollectionMetadata, err := metadata.GetCollection(lookupRequest.GetCollection())
		if err != nil {
			return nil, err
		}

		lookupFieldMetadata, err := lookupCollectionMetadata.GetField(condition.LookupField)
		if err != nil {
			return nil, err
		}

		lookupFieldName, err := GetUIFieldName(lookupFieldMetadata)
		if err != nil {
			return nil, err
		}

		conditionValue = lookupResponse.Data[0][lookupFieldName]
	} else {
		conditionValue = condition.Value
	}
	return conditionValue, nil
}
