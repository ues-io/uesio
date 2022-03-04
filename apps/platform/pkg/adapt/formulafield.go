package adapt

import (
	"os"

	"github.com/thecloudmasters/uesio/pkg/templating"
)

// FormulaFieldRequest type
type FormulaFieldRequest struct {
	//Fields    []LoadRequestField
	//FieldsMap map[string]bool
	//Metadata  *CollectionMetadata
	Field *FieldMetadata
}

// ReferencedFormulaFieldRegistry type
type ReferencedFormulaFieldRegistry map[string]*FormulaFieldRequest

// Add function
func (rr *ReferencedFormulaFieldRegistry) Add(fieldMetadata *FieldMetadata) *FormulaFieldRequest {

	rgr := &FormulaFieldRequest{
		Field: fieldMetadata,
	}

	(*rr)[fieldMetadata.GetFullName()] = rgr

	return rgr
}

func HandleFormulaFields(
	//collection loadable.Group,
	referencedFormulaFields ReferencedFormulaFieldRegistry,
) error {

	for _, ref := range referencedFormulaFields {

		template, err := templating.NewWithFuncs(ref.Field.FormulaOptions.Formula.(string))
		if err != nil {
			return err
		}
		err = template.Execute(os.Stdout, nil)
		if err != nil {
			return err
		}
	}

	return nil
}
