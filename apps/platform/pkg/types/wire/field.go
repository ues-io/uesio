package wire

import (
	"errors"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

func unmarshalViewOnlyField(node *yaml.Node) (*FieldMetadata, error) {
	// For now the only View Only field we want to process metadata for is SELECT or MULTISELECT,
	// to load the corresponding Select List.
	// TODO: Support view-only Reference fields.
	fieldType := meta.GetNodeValueAsString(node, "type")
	if fieldType == "SELECT" || fieldType == "MULTISELECT" {
		selectListNode := meta.GetMapNodeByKey(node, "selectlist")
		if selectListNode == nil {
			return nil, errors.New("invalid view-only SELECT field, no selectlist property found")
		}
		selectListKey := meta.GetNodeValueAsString(selectListNode, "name")
		if selectListKey != "" {
			return &FieldMetadata{
				Type: fieldType,
				SelectListMetadata: &SelectListMetadata{
					Name: selectListKey,
				},
			}, nil
		}
	}
	return &FieldMetadata{
		Type: fieldType,
	}, nil
}

func unmarshalFields(node *yaml.Node) ([]LoadRequestField, error) {
	isViewOnlyWire := meta.GetNodeValueAsBool(node, "viewOnly", false)
	isAggregateWire := meta.GetNodeValueAsBool(node, "aggregate", false)
	fieldsNode, _ := meta.GetMapNode(node, "fields")
	if fieldsNode == nil {
		return nil, nil
	}
	fieldPairs, err := meta.GetMapNodes(fieldsNode)
	if err != nil {
		return nil, err
	}
	var fields []LoadRequestField
	for _, fieldPair := range fieldPairs {
		subFields, err := unmarshalFields(fieldPair.Node)
		if err != nil {
			return nil, err
		}
		isViewOnlyField := meta.GetNodeValueAsBool(fieldPair.Node, "viewOnly", false)
		var viewOnlyMetadata *FieldMetadata
		if isViewOnlyWire || isViewOnlyField {
			viewOnlyMetadata, err = unmarshalViewOnlyField(fieldPair.Node)
			if err != nil {
				return nil, err
			}
		}
		var aggregateFunction string
		if isAggregateWire {
			aggregateFunction = meta.GetNodeValueAsString(fieldPair.Node, "function")
		}
		fields = append(fields, LoadRequestField{
			ID:               fieldPair.Key,
			Fields:           subFields,
			Function:         aggregateFunction,
			ViewOnlyMetadata: viewOnlyMetadata,
		})
	}
	return fields, nil
}

func unmarshalGroupBy(node *yaml.Node) ([]LoadRequestField, error) {

	fieldsNode, _ := meta.GetMapNode(node, "groupby")
	if fieldsNode == nil {
		return nil, nil
	}
	fieldPairs, err := meta.GetMapNodes(fieldsNode)
	if err != nil {
		return nil, err
	}
	var fields []LoadRequestField
	for _, fieldPair := range fieldPairs {

		aggregateFunction := meta.GetNodeValueAsString(fieldPair.Node, "function")

		fields = append(fields, LoadRequestField{
			ID:       fieldPair.Key,
			Function: aggregateFunction,
		})
	}
	return fields, nil
}

type LoadRequestField struct {
	ID               string             `json:"id" bot:"id"`
	Fields           []LoadRequestField `json:"fields,omitempty" bot:"fields"`
	Function         string             `json:"function,omitempty" bot:"function"`
	ViewOnlyMetadata *FieldMetadata     `json:"viewOnlyMetadata,omitempty"`
}

func (lrf *LoadRequestField) UnmarshalYAML(node *yaml.Node) error {

	fields, err := unmarshalFields(node)
	if err != nil {
		return err
	}
	lrf.Fields = fields
	return nil

}
