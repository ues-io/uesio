package meta

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

func GetNodeValueAsString(node *yaml.Node, key string) string {
	keyNode, err := GetMapNode(node, key)
	if err != nil {
		return ""
	}
	return GetScalarValueAsString(keyNode)
}

func GetNodeValueAsBool(node *yaml.Node, key string, defaultValue bool) bool {
	keyNode, err := GetMapNode(node, key)
	if err != nil {
		return defaultValue
	}
	if keyNode.Kind != yaml.ScalarNode {
		return defaultValue
	}
	return keyNode.Value != "false"
}

func GetNodeValueAsInt(node *yaml.Node, key string, defaultValue int) int {
	keyNode, err := GetMapNode(node, key)
	if err != nil {
		return defaultValue
	}
	if keyNode.Kind != yaml.ScalarNode {
		return defaultValue
	}

	intVal, err := strconv.Atoi(keyNode.Value)
	if err != nil {
		return defaultValue
	}
	return intVal
}

func GetScalarValueAsString(node *yaml.Node) string {
	if node.Kind != yaml.ScalarNode {
		return ""
	}
	return node.Value
}

type NodePair struct {
	Node *yaml.Node
	Key  string
}

func GetMapNodes(node *yaml.Node) ([]NodePair, error) {
	if node.Kind == yaml.DocumentNode {
		node = node.Content[0]
	}
	if node.Kind != yaml.MappingNode {
		return nil, fmt.Errorf("Definition is not a mapping node.")
	}

	contentSize := len(node.Content) / 2
	nodes := make([]NodePair, contentSize)

	for i := 0; i < contentSize; i++ {
		j := i * 2
		nodes[i] = NodePair{
			Node: node.Content[j+1],
			Key:  node.Content[j].Value,
		}
	}

	return nodes, nil
}

func GetMapNode(node *yaml.Node, key string) (*yaml.Node, error) {
	mapnode, _, err := GetMapNodeWithIndex(node, key)
	if err != nil {
		return nil, err
	}
	return mapnode, nil
}

func GetMapNodeWithIndex(node *yaml.Node, key string) (*yaml.Node, int, error) {
	if node.Kind == yaml.DocumentNode {
		node = node.Content[0]
	}
	if node.Kind != yaml.MappingNode {
		return nil, 0, fmt.Errorf("Definition is not a mapping node.")
	}

	for i := range node.Content {
		// Skip every other node to only get keys
		if i%2 == 0 && node.Content[i].Value == key {
			return node.Content[i+1], i, nil
		}
	}

	return nil, 0, fmt.Errorf("Node not found of key: " + key)
}

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

// Removes an entry from a map node and returns it.
func pickNodeFromMap(node *yaml.Node, property string) *yaml.Node {
	keyNode, index, err := GetMapNodeWithIndex(node, property)
	if err != nil {
		return nil
	}
	// delete key and value nodes
	node.Content = append(node.Content[:index], node.Content[index+2:]...)
	return keyNode
}

// Gets a property from a map node of a yaml definition and removes that property from the node.
func pickStringProperty(node *yaml.Node, property, defaultValue string) string {
	valueNode := pickNodeFromMap(node, property)
	if valueNode == nil {
		return defaultValue
	}
	value := GetScalarValueAsString(valueNode)
	if value == "" {
		return defaultValue
	}
	return value
}

func pickMetadataItem(node *yaml.Node, property, namespace, defaultValue string) string {
	return GetFullyQualifiedKey(pickStringProperty(node, property, defaultValue), namespace)
}

func pickRequiredMetadataItem(node *yaml.Node, property, namespace string) (string, error) {
	value := pickMetadataItem(node, property, namespace, "")
	if value == "" {
		return "", fmt.Errorf("property %s is required", property)
	}
	return value, nil
}

func removeDefault(itemkey, defaultValue string) string {
	if itemkey == defaultValue {
		return ""
	}
	return itemkey
}

// This function removes the given property from a yaml node and verifies that it
// matches the expected value. It also verifies that the value is a valid metadata name format.
func validateMetadataNameNode(node *yaml.Node, expectedName, nameKey string) error {
	name := pickStringProperty(node, nameKey, "")
	if name != expectedName {
		return fmt.Errorf("Metadata name does not match filename: %s, %s", name, expectedName)
	}
	if !IsValidMetadataName(name) {
		return fmt.Errorf("Failed metadata validation, no capital letters or special characters allowed: %s", name)
	}
	return nil
}

func validateNodeName(node *yaml.Node, expectedName string) error {
	return validateMetadataNameNode(node, expectedName, "name")
}

func getYamlNode(yamlContent string) *YAMLDef {
	yamlNode := &YAMLDef{}
	yaml.Unmarshal([]byte(yamlContent), yamlNode)
	return yamlNode
}

func trimYamlString(yamlContent string) string {
	return strings.TrimPrefix(yamlContent, "\n")
}
