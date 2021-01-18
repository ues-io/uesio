package adapters

import (
	"errors"
)

// GetConditionValue function
func GetConditionValue(
	condition LoadRequestCondition,
	op *LoadOp,
	metadata *MetadataCache,
	ops []LoadOp,
) (interface{}, error) {
	var conditionValue interface{}
	if condition.ValueSource == "LOOKUP" && condition.LookupWire != "" && condition.LookupField != "" {

		// Look through the previous wires to find the one to look up on.
		var lookupOp LoadOp
		for _, op := range ops {
			if op.WireName == condition.LookupWire {
				lookupOp = op
			}
		}

		if lookupOp.Collection.Len() != 1 {
			return nil, errors.New("Must lookup on wires with only one record")
		}

		lookupCollectionMetadata, err := metadata.GetCollection(lookupOp.CollectionName)
		if err != nil {
			return nil, err
		}

		lookupFieldMetadata, err := lookupCollectionMetadata.GetField(condition.LookupField)
		if err != nil {
			return nil, err
		}

		conditionValue, err = lookupOp.Collection.GetItem(0).GetField(lookupFieldMetadata.GetFullName())
		if err != nil {
			return nil, err
		}

	} else {
		conditionValue = condition.Value
	}
	return conditionValue, nil
}
