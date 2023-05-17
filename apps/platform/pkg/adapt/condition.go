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
	ID             string                 `json:"id" bot:"id" yaml:"id"`
	Field          string                 `json:"field" bot:"field" yaml:"field"`
	Value          interface{}            `json:"value" bot:"value" yaml:"value"`
	Values         interface{}            `json:"values" bot:"values" yaml:"values"`
	Param          string                 `json:"param" yaml:"param"`
	Params         string                 `json:"params" yaml:"params"`
	ValueSource    string                 `json:"valueSource" yaml:"valueSource"`
	Type           string                 `json:"type" bot:"type" yaml:"type"`
	Operator       string                 `json:"operator" bot:"operator" yaml:"operator"`
	LookupWire     string                 `json:"lookupWire" yaml:"lookupWire"`
	LookupField    string                 `json:"lookupField" yaml:"lookupField"`
	SearchFields   []string               `json:"fields" bot:"fields" yaml:"fields"`
	SubConditions  []LoadRequestCondition `json:"conditions" bot:"conditions" yaml:"conditions"`
	SubCollection  string                 `json:"subcollection" bot:"subcollection" yaml:"subcollection"`
	SubField       string                 `json:"subfield" bot:"subfield" yaml:"subfield"`
	Conjunction    string                 `json:"conjunction" bot:"conjunction" yaml:"conjunction"`
	Start          interface{}            `json:"start" bot:"start" yaml:"start"`
	End            interface{}            `json:"end" bot:"end" yaml:"end"`
	InclusiveStart bool                   `json:"inclusiveStart" bot:"inclusiveStart" yaml:"inclusiveStart"`
	InclusiveEnd   bool                   `json:"inclusiveEnd" bot:"inclusiveEnd" yaml:"inclusiveEnd"`
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
