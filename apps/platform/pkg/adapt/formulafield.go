package adapt

import (
	"errors"
	"text/template"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
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

// NewFieldChanges function returns a template that can merge field changes
func getTemplate(templateString string, collectionMetadata *CollectionMetadata) (*template.Template, error) {
	return templating.NewWithFunc(templateString, func(item loadable.Item, key string) (interface{}, error) {
		fieldMetadata, err := collectionMetadata.GetField(key)
		if err != nil {
			return nil, err
		}
		val, err := item.GetField(key)
		if err != nil {
			return nil, errors.New("missing key " + key + " : " + collectionMetadata.GetFullName() + " : " + templateString)
		}
		if IsReference(fieldMetadata.Type) {
			key, err := GetReferenceKey(val)
			if err != nil {
				return nil, err
			}
			if key == "" {
				return nil, errors.New("Bad Reference Key in template: " + templateString)
			}
			return key, nil
		}
		return val, nil
	})
}

func HandleFormulaFields(
	referencedFormulaFields ReferencedFormulaFieldRegistry,
	collectionMetadata *CollectionMetadata,
	item loadable.Item,
) error {

	for _, ref := range referencedFormulaFields {
		formulaField := ref.Field
		if formulaField.FormulaOptions != nil {
			formula := formulaField.FormulaOptions.Formula
			idTemplate, err := getTemplate(formula, collectionMetadata)
			if err != nil {
				return err
			}
			value, err := templating.Execute(idTemplate, item)
			if err != nil {
				return err
			}
			item.SetField(formulaField.GetFullName(), value)
		}
	}

	return nil
}
