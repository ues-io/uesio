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

		formula := ref.Field.FormulaOptions.Formula

		// template, err := templating.NewWithFunc(template, func(m map[string]interface{}, key string) (interface{}, error) {
		// 	return GetValueFromKey(key, session)
		// })
		// if err != nil {
		// 	return "", err
		// }

		template, err := templating.NewWithFuncs(formula, nil, nil)
		if err != nil {
			return err
		}

		err = template.Execute(os.Stdout, formula)
		if err != nil {
			return err
		}
	}

	return nil
}
