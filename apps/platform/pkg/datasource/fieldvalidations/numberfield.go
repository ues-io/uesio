package fieldvalidations

import (
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func ValidateNumberField(field *wire.FieldMetadata) ValidationFunc {
	return func(change *wire.ChangeItem) *wire.SaveError {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if val == nil {
			return nil
		}
		_, isFloat := val.(float64)
		_, isInt64 := val.(int64)
		_, isInt := val.(int)
		if err == nil && !isFloat && !isInt64 && !isInt {
			return wire.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" is not a valid number")
		}
		return nil
	}
}
