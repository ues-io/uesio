package fieldvalidations

import (
	"fmt"
	"regexp"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func ValidateRegex(field *wire.FieldMetadata) ValidationFunc {
	regex, err := regexp.Compile(field.ValidationMetadata.Regex)
	if err != nil {
		return func(change *wire.ChangeItem) *exceptions.SaveException {
			return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), fmt.Errorf("Regex for the field: %s is not valid", field.Label))
		}
	}
	return func(change *wire.ChangeItem) *exceptions.SaveException {
		val, err2 := change.FieldChanges.GetField(field.GetFullName())
		if err2 == nil && !regex.MatchString(fmt.Sprintf("%v", val)) {
			return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), fmt.Errorf("Field: %s does not follow the expected format pattern", field.Label))
		}
		return nil
	}
}
