package fieldvalidations

import (
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func ValidateRequiredField(field *wire.FieldMetadata) ValidationFunc {
	return func(change *wire.ChangeItem) *wire.SaveError {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		valueIsUndefined := err != nil
		valueIsEmpty := val == "" || val == nil
		isMissingInsert := change.IsNew && (valueIsUndefined || valueIsEmpty)
		isMissingUpdate := !change.IsNew && !valueIsUndefined && valueIsEmpty
		if isMissingInsert || isMissingUpdate {
			return wire.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" is required")
		}
		return nil
	}
}
