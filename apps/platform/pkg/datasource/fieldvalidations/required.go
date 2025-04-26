package fieldvalidations

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func ValidateRequiredField(field *wire.FieldMetadata) ValidationFunc {
	return func(change *wire.ChangeItem) *exceptions.SaveException {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		valueIsUndefined := err != nil
		valueIsEmpty := val == "" || val == nil
		isMissingInsert := change.IsNew && (valueIsUndefined || valueIsEmpty)
		isMissingUpdate := !change.IsNew && !valueIsUndefined && valueIsEmpty
		if isMissingInsert || isMissingUpdate {
			return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), fmt.Sprintf("field: %s is required", field.Label), nil)
		}
		return nil
	}
}
