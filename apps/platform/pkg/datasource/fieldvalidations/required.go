package fieldvalidations

import "github.com/thecloudmasters/uesio/pkg/adapt"

func ValidateRequiredField(field *adapt.FieldMetadata) ValidationFunc {
	return func(change *adapt.ChangeItem) *adapt.SaveError {

		isInsert := change.IsNew
		val, err := change.FieldChanges.GetField(field.GetFullName())
		fieldIsBeingUpdated := (err == nil)
		//TO-DO we can add more types of empty values here
		isEmpty := val == nil || val == ""

		//It's an insert and the field is empty
		if isInsert {
			if isEmpty {
				return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" is required")
			}
			return nil
		}

		//It's an update and the field is being updated
		if fieldIsBeingUpdated {
			if isEmpty {
				return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" is required")
			}
		}

		return nil
	}
}
