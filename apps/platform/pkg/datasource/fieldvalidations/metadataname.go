package fieldvalidations

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func validateMetadataName(field *wire.FieldMetadata) ValidationFunc {
	return func(change *wire.ChangeItem) *exceptions.SaveException {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && !meta.IsValidMetadataName(fmt.Sprintf("%v", val)) {
			return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), fmt.Sprintf("Field: %s failed metadata validation, can only contain lowercase characters a-z, the underscore character and the numerals 0-9", field.Label), nil)
		}
		return nil
	}
}
