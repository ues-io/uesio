package fieldvalidations

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func ValidateRequiredField(field *adapt.FieldMetadata) ValidationFunc {
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		valueIsUndefined := err != nil
		valueIsEmpty := val == "" || val == nil
		isMissingInsert := change.IsNew && (valueIsUndefined || valueIsEmpty)
		isMissingUpdate := !change.IsNew && !valueIsUndefined && valueIsEmpty
		if isMissingInsert || isMissingUpdate {
			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" is required")
		}
		return nil
	}
}
