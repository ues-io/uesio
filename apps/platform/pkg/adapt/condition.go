package adapt

import (
	"errors"
	"strings"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/meta"
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
	ID             string                 `json:"id,omitempty" bot:"id" yaml:"id"`
	Field          string                 `json:"field" bot:"field" yaml:"field"`
	Value          interface{}            `json:"-" bot:"value" yaml:"-"`
	Values         interface{}            `json:"-" bot:"values" yaml:"-"`
	RawValue       interface{}            `json:"value,omitempty" yaml:"value"`
	RawValues      interface{}            `json:"values,omitempty" yaml:"values"`
	Param          string                 `json:"param,omitempty" yaml:"param"`
	Params         []string               `json:"params,omitempty" yaml:"params"`
	ValueSource    string                 `json:"valueSource,omitempty" yaml:"valueSource"`
	Type           string                 `json:"type,omitempty" bot:"type" yaml:"type"`
	Operator       string                 `json:"operator,omitempty" bot:"operator" yaml:"operator"`
	LookupWire     string                 `json:"lookupWire,omitempty" yaml:"lookupWire"`
	LookupField    string                 `json:"lookupField,omitempty" yaml:"lookupField"`
	SearchFields   []string               `json:"fields,omitempty" bot:"fields" yaml:"fields"`
	SubConditions  []LoadRequestCondition `json:"conditions,omitempty" bot:"conditions" yaml:"conditions"`
	SubCollection  string                 `json:"subcollection,omitempty" bot:"subcollection" yaml:"subcollection"`
	SubField       string                 `json:"subfield,omitempty" bot:"subfield" yaml:"subfield"`
	Conjunction    string                 `json:"conjunction,omitempty" bot:"conjunction" yaml:"conjunction"`
	Start          interface{}            `json:"start,omitempty" bot:"start" yaml:"start"`
	End            interface{}            `json:"end,omitempty" bot:"end" yaml:"end"`
	InclusiveStart bool                   `json:"inclusiveStart,omitempty" bot:"inclusiveStart" yaml:"inclusiveStart"`
	InclusiveEnd   bool                   `json:"inclusiveEnd,omitempty" bot:"inclusiveEnd" yaml:"inclusiveEnd"`
	Inactive       bool                   `json:"inactive" bot:"inactive" yaml:"inactive"`
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
