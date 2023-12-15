package fieldvalidations

import (
	"fmt"
	"regexp"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

func isEmailValid(e string) bool {
	if len(e) < 3 && len(e) > 254 {
		return false
	}
	return emailRegex.MatchString(e)
}

func ValidateEmailField(field *wire.FieldMetadata) ValidationFunc {
	return func(change *wire.ChangeItem) *exceptions.SaveException {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && val != "" {
			if !isEmailValid(fmt.Sprintf("%v", val)) {
				return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), field.Label+" is not a valid email address")
			}
		}
		return nil
	}
}
