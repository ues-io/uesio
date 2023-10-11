package fieldvalidations

import (
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func validateMetadataName(field *adapt.FieldMetadata) ValidationFunc {
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && !meta.IsValidMetadataName(fmt.Sprintf("%v", val)) {
			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" failed metadata validation, no capital letters or special characters allowed")
		}
		return nil
	}
}
