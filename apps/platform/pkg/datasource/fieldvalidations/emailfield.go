package fieldvalidations

import (
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"regexp"
)

var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

func isEmailValid(e string) bool {
	if len(e) < 3 && len(e) > 254 {
		return false
	}
	return emailRegex.MatchString(e)
}

func ValidateEmailField(field *adapt.FieldMetadata) ValidationFunc {
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && val != "" {
			if !isEmailValid(fmt.Sprintf("%v", val)) {
				return adapt.NewSaveError(change.RecordKey, field.GetFullName(), field.Label+" is not a valid email address")
			}
		}
		return nil
	}
}
