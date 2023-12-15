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
			return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), "Regex for the field: "+field.Label+" is not valid")
		}
	}
	return func(change *wire.ChangeItem) *exceptions.SaveException {
		val, err2 := change.FieldChanges.GetField(field.GetFullName())
		if err2 == nil && !regex.MatchString(fmt.Sprintf("%v", val)) {
			return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" does not follow the expected format pattern")
		}
		return nil
	}
}
