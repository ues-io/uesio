package meta

import (
	"fmt"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

// YAMLDefinition is a Gojay wrapper around a yaml.Node,
// providing methods to satisfy Gojay's JSON marshalling interfaces
type YAMLDefinition yaml.Node

func (yd *YAMLDefinition) MarshalJSONArray(enc *gojay.Encoder) {
	if yd.Kind == yaml.DocumentNode {
		yd = (*YAMLDefinition)(yd.Content[0])
	}
	for i := range yd.Content {
		item := YAMLDefinition(*yd.Content[i])
		if item.Kind == yaml.ScalarNode {
			var value interface{}
			err := yd.Content[i].Decode(&value)
			if err != nil {
				fmt.Println("Got an error decoding scalar: " + item.Value)
				continue
			}
			if value == nil {
				enc.AddNull()
			} else {
				enc.AddInterface(value)
			}
		}
		if item.Kind == yaml.SequenceNode {
			enc.AddArray(&item)
		}
		if item.Kind == yaml.MappingNode {
			enc.AddObject(&item)
		}
	}
}

func (yd *YAMLDefinition) MarshalJSONObject(enc *gojay.Encoder) {
	if yd.Kind == yaml.DocumentNode {
		yd = (*YAMLDefinition)(yd.Content[0])
	}
	if yd.Kind == yaml.ScalarNode {
		enc.AddString(yd.Value)
	}
	if yd.Kind == yaml.SequenceNode {
		yd.MarshalJSONArray(enc)
	}
	if yd.Kind == yaml.MappingNode {
		for i := range yd.Content {
			if i%2 != 0 {
				continue
			}
			keyItem := yd.Content[i]
			valueItem := YAMLDefinition(*yd.Content[i+1])
			if valueItem.Kind == yaml.ScalarNode {
				var value interface{}
				err := yd.Content[i+1].Decode(&value)
				if err != nil {
					fmt.Println("Got an error decoding scalar in map: " + keyItem.Value + " : " + valueItem.Value)
					continue
				}
				if value == nil {
					enc.AddNullKey(keyItem.Value)
				} else {
					enc.AddInterfaceKey(keyItem.Value, value)
				}

			}
			if valueItem.Kind == yaml.SequenceNode {
				enc.AddArrayKey(keyItem.Value, &valueItem)
			}
			if valueItem.Kind == yaml.MappingNode {
				enc.AddObjectKey(keyItem.Value, &valueItem)
			}

		}
	}

}
func (yd *YAMLDefinition) IsNil() bool {
	return yd == nil
}

func nodeIsNull(node *yaml.Node) bool {
	return node.Kind == yaml.ScalarNode && node.ShortTag() == "!!null"
}
