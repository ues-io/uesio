package meta

import (
	"fmt"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

// YAMLtoJSONArray is a Gojay wrapper around a yaml.Node,
// providing methods to satisfy Gojay's JSON marshalling interfaces
type YAMLtoJSONArray yaml.Node

func (yd *YAMLtoJSONArray) IsNil() bool {
	return yd == nil || (yd.Kind != yaml.DocumentNode && yd.Kind != yaml.SequenceNode)
}

func (yd *YAMLtoJSONArray) MarshalJSONArray(enc *gojay.Encoder) {
	if yd.Kind == yaml.DocumentNode {
		yd = (*YAMLtoJSONArray)(yd.Content[0])
	}
	for i := range yd.Content {
		item := yd.Content[i]
		if item.Kind == yaml.ScalarNode {
			var value any
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
			enc.AddArray((*YAMLtoJSONArray)(item))
		}
		if item.Kind == yaml.MappingNode {
			enc.AddObject((*YAMLtoJSONMap)(item))
		}
	}
}

type YAMLtoJSONMap yaml.Node

func (yd *YAMLtoJSONMap) IsNil() bool {
	return yd == nil || (yd.Kind != yaml.DocumentNode && yd.Kind != yaml.MappingNode)
}

func (yd *YAMLtoJSONMap) MarshalJSONObject(enc *gojay.Encoder) {
	if yd.Kind == yaml.DocumentNode {
		yd = (*YAMLtoJSONMap)(yd.Content[0])
	}
	if yd.Kind == yaml.MappingNode {
		for i := range yd.Content {
			if i%2 != 0 {
				continue
			}
			keyItem := yd.Content[i]
			valueItem := yd.Content[i+1]
			if valueItem.Kind == yaml.ScalarNode {
				var value any
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
				enc.AddArrayKey(keyItem.Value, (*YAMLtoJSONArray)(valueItem))
			}
			if valueItem.Kind == yaml.MappingNode {
				enc.AddObjectKey(keyItem.Value, (*YAMLtoJSONMap)(valueItem))
			}

		}
	}

}

func nodeIsNull(node *yaml.Node) bool {
	return node.Kind == yaml.ScalarNode && node.ShortTag() == "!!null"
}
