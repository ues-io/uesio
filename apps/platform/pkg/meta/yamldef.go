package meta

import (
	"encoding/json"

	"gopkg.in/yaml.v3"
)

// YAMLDef is a wrapper around a yaml.Node
// providing methods to satisfy Go's native YAMl/JSON serialization
// to/from byte arrays.
type YAMLDef yaml.Node

func (yd *YAMLDef) UnmarshalJSON(data []byte) error {
	var yamlString string
	err := json.Unmarshal(data, &yamlString)
	if err != nil {
		return err
	}
	return yaml.Unmarshal([]byte(yamlString), (*yaml.Node)(yd))
}

func (yd *YAMLDef) MarshalJSON() ([]byte, error) {
	out, err := yaml.Marshal((*yaml.Node)(yd))
	if err != nil {
		return nil, err
	}
	return json.Marshal(string(out))
}

func (yd *YAMLDef) UnmarshalYAML(node *yaml.Node) error {
	return node.Decode((*yaml.Node)(yd))
}

func (yd *YAMLDef) MarshalYAML() (interface{}, error) {
	if yd.Kind == yaml.DocumentNode {
		return (*yaml.Node)(yd).Content[0], nil
	}
	return (*yaml.Node)(yd), nil
}

func (yd *YAMLDef) Decode(v interface{}) error {
	return (*yaml.Node)(yd).Decode(v)
}
