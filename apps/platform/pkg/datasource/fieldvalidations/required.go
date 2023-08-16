package fieldvalidations

import "github.com/thecloudmasters/uesio/pkg/adapt"

func ValidateRequiredField(field *adapt.FieldMetadata) ValidationFunc {
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if (change.IsNew && err != nil) || val == "" {
			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" is required")
		}
		return nil
	}
}
