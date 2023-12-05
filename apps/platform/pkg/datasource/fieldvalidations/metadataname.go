package fieldvalidations

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func validateMetadataName(field *wire.FieldMetadata) ValidationFunc {
	return func(change *wire.ChangeItem) *wire.SaveError {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && !meta.IsValidMetadataName(fmt.Sprintf("%v", val)) {
			return wire.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" failed metadata validation, no capital letters or special characters allowed")
		}
		return nil
	}
}
