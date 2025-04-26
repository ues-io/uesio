package meta

import (
	"fmt"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"

	"slices"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func GetMapNodeByKey(node *yaml.Node, key string) *yaml.Node {
	targetNode, err := GetMapNode(node, key)
	if err != nil {
		return nil
	}
	return targetNode
}

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

func UnwrapDocumentNode(node *yaml.Node) *yaml.Node {
	if node != nil && node.Kind == yaml.DocumentNode {
		return node.Content[0]
	}
	return node
}

func GetMapNodes(node *yaml.Node) ([]NodePair, error) {

	node = UnwrapDocumentNode(node)
	if node.Kind != yaml.MappingNode {
		return nil, fmt.Errorf("definition is not a mapping node")
	}

	contentSize := len(node.Content) / 2
	nodes := make([]NodePair, contentSize)

	for i := range contentSize {
		j := i * 2
		nodes[i] = NodePair{
			Node: node.Content[j+1],
			Key:  node.Content[j].Value,
		}
	}

	return nodes, nil
}

func GetMapNode(node *yaml.Node, key string) (*yaml.Node, error) {
	mapNode, _, err := GetMapNodeWithIndex(node, key)
	if err != nil {
		return nil, err
	}
	return mapNode, nil
}

func GetMapNodeWithIndex(node *yaml.Node, key string) (*yaml.Node, int, error) {
	node = UnwrapDocumentNode(node)
	if node.Kind != yaml.MappingNode {
		return nil, 0, fmt.Errorf("definition is not a mapping node")
	}

	for i := range node.Content {
		// Skip every other node to only get keys
		if i%2 == 0 && node.Content[i].Value == key {
			return node.Content[i+1], i, nil
		}
	}

	return nil, 0, fmt.Errorf("node not found of key: %s", key)
}

// Removes an entry from a map node and returns it.
func pickNodeFromMap(node *yaml.Node, property string) *yaml.Node {
	keyNode, index, err := GetMapNodeWithIndex(node, property)
	if err != nil {
		return nil
	}
	// delete key and value nodes
	node.Content = slices.Delete(node.Content, index, index+2)
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

// Gets a string list property from a map node of a yaml definition and removes that property from the node.
func pickStringListProperty(node *yaml.Node, property string) []string {
	valueNode := pickNodeFromMap(node, property)
	if valueNode == nil {
		return []string{}
	}
	return GetSequenceValueAsStringList(valueNode)
}

func pickMetadataItem(node *yaml.Node, property, namespace, defaultValue string) string {
	return GetFullyQualifiedKey(pickStringProperty(node, property, defaultValue), namespace)
}

func pickMetadataItems(node *yaml.Node, property, namespace string) []string {
	return GetFullyQualifiedKeys(pickStringListProperty(node, property), namespace)
}

func pickRequiredMetadataItem(node *yaml.Node, property, namespace string) (string, error) {
	value := pickMetadataItem(node, property, namespace, "")
	if value == "" {
		return "", fmt.Errorf("property %s is required", property)
	}
	return value, nil
}

func removeDefault(itemKey, defaultValue string) string {
	if itemKey == defaultValue {
		return ""
	}
	return itemKey
}

// This function removes the given property from a yaml node and verifies that it
// matches the expected value. It also verifies that the value is a valid metadata name format.
func validateMetadataNameNode(node *yaml.Node, expectedName, nameKey string) error {
	return validateMetadataName(pickStringProperty(node, nameKey, ""), expectedName)
}

func validateMetadataName(name string, expectedName string) error {
	if expectedName != "" && name != expectedName {
		return exceptions.NewBadRequestException(fmt.Sprintf("metadata name does not match filename: %s, %s", name, expectedName), nil)
	}
	if !IsValidMetadataName(name) {
		return exceptions.NewBadRequestException(fmt.Sprintf("failed metadata validation, can only contain lowercase characters a-z, the underscore character and the numerals 0-9: %s", name), nil)
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

func TrimYamlString(yamlContent string) string {
	return strings.TrimPrefix(yamlContent, "\n")
}

func GetSequenceValueAsStringList(node *yaml.Node) []string {
	if node.Kind != yaml.SequenceNode {
		return []string{}
	}
	var stringValues []string
	for _, v := range node.Content {
		if v.Kind != yaml.ScalarNode {
			continue
		}
		stringValues = append(stringValues, v.Value)
	}
	return stringValues
}
