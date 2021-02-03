package adapt

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

		return lookupOp.Collection.GetItem(0).GetField(condition.LookupField)

	}

	return condition.Value, nil
}
