package fieldvalidations

import (
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"regexp"
)

func ValidateRegex(field *adapt.FieldMetadata) ValidationFunc {
	regex, err := regexp.Compile(field.ValidationMetadata.Regex)
	if err != nil {
		return func(change *adapt.ChangeItem) *adapt.SaveError {
			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Regex for the field: "+field.Label+" is not valid")
		}
	}
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		val, err2 := change.FieldChanges.GetField(field.GetFullName())
		if err2 == nil && !regex.MatchString(fmt.Sprintf("%v", val)) {
			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" does not follow the expected format pattern")
		}
		return nil
	}
}
