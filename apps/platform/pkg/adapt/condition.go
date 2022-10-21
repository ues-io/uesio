package adapt

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"gopkg.in/yaml.v3"
)

func unmarshalConditions(node *yaml.Node) ([]LoadRequestCondition, error) {
	conditions := []LoadRequestCondition{}
	conditionsNode, err := meta.GetMapNode(node, "conditions")
	if err != nil {
		return conditions, nil
	}

	err = conditionsNode.Decode(&conditions)
	if err != nil {
		return nil, err
	}

	return conditions, nil
}

type LoadRequestCondition struct {
	Field         string                 `json:"field" bot:"field" yaml:"field"`
	Value         interface{}            `json:"value" bot:"value" yaml:"value"`
	Param         string                 `json:"param" yaml:"param"`
	ValueSource   string                 `json:"valueSource" yaml:"valueSource"`
	Type          string                 `json:"type" yaml:"type"`
	Operator      string                 `json:"operator" yaml:"operator"`
	LookupWire    string                 `json:"lookupWire" yaml:"lookupWire"`
	LookupField   string                 `json:"lookupField" yaml:"lookupField"`
	SearchFields  []string               `json:"fields" yaml:"fields"`
	SubConditions []LoadRequestCondition `json:"conditions" yaml:"conditions"`
	Conjunction   string                 `json:"conjunction" yaml:"conjunction"`
}
