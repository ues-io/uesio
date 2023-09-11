package adapt

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"gopkg.in/yaml.v3"
)

func unmarshalFields(node *yaml.Node) ([]LoadRequestField, error) {
	fieldsNode, _ := meta.GetMapNode(node, "fields")
	if fieldsNode == nil {
		return nil, nil
	}
	fieldPairs, err := meta.GetMapNodes(fieldsNode)
	if err != nil {
		return nil, err
	}
	fields := []LoadRequestField{}
	for _, fieldPair := range fieldPairs {

		isViewOnly := meta.GetNodeValueAsBool(fieldPair.Node, "viewOnly", false)
		if isViewOnly {
			continue
		}

		subFields, err := unmarshalFields(fieldPair.Node)
		if err != nil {
			return nil, err
		}
		fields = append(fields, LoadRequestField{
			ID:     fieldPair.Key,
			Fields: subFields,
		})
	}
	return fields, nil
}

type LoadRequestField struct {
	ID     string             `json:"id" bot:"id"`
	Fields []LoadRequestField `json:"fields,omitempty" bot:"fields"`
}

func (lrf *LoadRequestField) UnmarshalYAML(node *yaml.Node) error {

	fields, err := unmarshalFields(node)
	if err != nil {
		return err
	}
	lrf.Fields = fields
	return nil

}
