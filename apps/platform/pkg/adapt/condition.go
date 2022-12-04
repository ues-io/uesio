package adapt

import (
	"errors"
	"strings"

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
	Type          string                 `json:"type" bot:"type" yaml:"type"`
	Operator      string                 `json:"operator" bot:"operator" yaml:"operator"`
	LookupWire    string                 `json:"lookupWire" yaml:"lookupWire"`
	LookupField   string                 `json:"lookupField" yaml:"lookupField"`
	SearchFields  []string               `json:"fields" bot:"fields" yaml:"fields"`
	SubConditions []LoadRequestCondition `json:"conditions" bot:"conditions" yaml:"conditions"`
	SubCollection string                 `json:"subcollection" bot:"subcollection" yaml:"subcollection"`
	SubField      string                 `json:"subfield" bot:"subfield" yaml:"subfield"`
	Conjunction   string                 `json:"conjunction" bot:"conjunction" yaml:"conjunction"`
}

func GetStringSlice(input interface{}) ([]string, error) {
	sliceString, ok := input.([]string)
	if ok {
		return sliceString, nil
	}
	sliceInterface, ok := input.([]interface{})
	if ok {
		sliceString := []string{}
		for _, value := range sliceInterface {
			stringValue, ok := value.(string)
			if !ok {
				return nil, errors.New("Invalid Parameter Value")
			}
			sliceString = append(sliceString, stringValue)
		}
		return sliceString, nil
	}

	repeaterString, ok := input.(string)
	if !ok {
		return nil, errors.New("Invalid Parameter Value")
	}
	return strings.Split(repeaterString, ","), nil
}
