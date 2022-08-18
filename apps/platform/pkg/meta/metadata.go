package meta

import (
	"errors"
	"fmt"
	"os"
	"reflect"
	"regexp"
	"strings"
	"time"

	"github.com/francoispqt/gojay"
	"github.com/humandad/yaml"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/reflecttool"
)

type ItemMeta struct {
	ValidFields map[string]bool
}

func (im *ItemMeta) IsValidField(fieldName string) bool {
	if im.ValidFields != nil {
		valid, ok := im.ValidFields[fieldName]
		return ok && valid
	}
	return true
}

type BundleConditions map[string]string

type CollectionableGroup interface {
	loadable.Group
	GetName() string
	GetFields() []string
}

type CollectionableItem interface {
	loadable.Item
	GetCollectionName() string
	GetCollection() CollectionableGroup
	GetItemMeta() *ItemMeta
	SetItemMeta(*ItemMeta)
}

type BundleableGroup interface {
	CollectionableGroup
	GetBundleFolderName() string
	GetKeyFromPath(string, string, BundleConditions) (string, error)
	NewBundleableItemWithKey(key string) (BundleableItem, error)
}

type BundleableItem interface {
	CollectionableItem
	GetBundleGroup() BundleableGroup
	GetPermChecker() *PermissionSet
	GetKey() string
	GetPath() string
	GetDBID(string) string
	SetNamespace(string)
	GetNamespace() string
	SetModified(time.Time)
	IsPublic() bool
}

func ParseKey(key string) (string, string, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return "", "", errors.New("Invalid Key: " + key)
	}
	return keyArray[0], keyArray[1], nil
}

func ParseNamespace(namespace string) (string, string, error) {
	keyArray := strings.Split(namespace, "/")
	if len(keyArray) != 2 {
		return "", "", errors.New("Invalid Namespace: " + namespace)
	}
	return keyArray[0], keyArray[1], nil
}

func StandardKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	if len(conditions) > 0 {
		return "", errors.New("Conditions not allowed for this type")
	}
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 1 || !strings.HasSuffix(parts[0], ".yaml") {
		// Ignore this file
		return "", nil
	}
	return namespace + "." + strings.TrimSuffix(path, ".yaml"), nil
}

func StandardGetFields(item CollectionableItem) []string {
	names, err := reflecttool.GetFieldNames(item)
	if err != nil {
		return []string{}
	}
	return names
}

func StandardFieldGet(item CollectionableItem, fieldName string) (interface{}, error) {
	itemMeta := item.GetItemMeta()
	if itemMeta != nil && !itemMeta.IsValidField(fieldName) {
		return nil, errors.New("Field Not Found: " + item.GetCollectionName() + " : " + fieldName)
	}
	return reflecttool.GetField(item, fieldName)
}

func StandardFieldSet(item CollectionableItem, fieldName string, value interface{}) error {
	return reflecttool.SetField(item, fieldName, value)
}

func StandardItemLoop(item CollectionableItem, iter func(string, interface{}) error) error {
	itemMeta := item.GetItemMeta()
	for _, fieldName := range StandardGetFields(item) {
		if itemMeta != nil && !itemMeta.IsValidField(fieldName) {
			continue
		}
		val, err := item.GetField(fieldName)
		if err != nil {
			return err
		}
		err = iter(fieldName, val)
		if err != nil {
			return err
		}
	}
	return nil
}

func StandardItemLen(item CollectionableItem) int {
	return len(StandardGetFields(item))
}

type BundleableFactory func() BundleableGroup

var bundleableGroupMap = map[string]BundleableFactory{
	(&SecretCollection{}).GetBundleFolderName():             func() BundleableGroup { return &SecretCollection{} },
	(&ProfileCollection{}).GetBundleFolderName():            func() BundleableGroup { return &ProfileCollection{} },
	(&PermissionSetCollection{}).GetBundleFolderName():      func() BundleableGroup { return &PermissionSetCollection{} },
	(&ConfigValueCollection{}).GetBundleFolderName():        func() BundleableGroup { return &ConfigValueCollection{} },
	(&DataSourceCollection{}).GetBundleFolderName():         func() BundleableGroup { return &DataSourceCollection{} },
	(&FileSourceCollection{}).GetBundleFolderName():         func() BundleableGroup { return &FileSourceCollection{} },
	(&FileCollection{}).GetBundleFolderName():               func() BundleableGroup { return &FileCollection{} },
	(&FieldCollection{}).GetBundleFolderName():              func() BundleableGroup { return &FieldCollection{} },
	(&BotCollection{}).GetBundleFolderName():                func() BundleableGroup { return &BotCollection{} },
	(&CollectionCollection{}).GetBundleFolderName():         func() BundleableGroup { return &CollectionCollection{} },
	(&SelectListCollection{}).GetBundleFolderName():         func() BundleableGroup { return &SelectListCollection{} },
	(&RouteCollection{}).GetBundleFolderName():              func() BundleableGroup { return &RouteCollection{} },
	(&ViewCollection{}).GetBundleFolderName():               func() BundleableGroup { return &ViewCollection{} },
	(&ThemeCollection{}).GetBundleFolderName():              func() BundleableGroup { return &ThemeCollection{} },
	(&CredentialCollection{}).GetBundleFolderName():         func() BundleableGroup { return &CredentialCollection{} },
	(&ComponentPackCollection{}).GetBundleFolderName():      func() BundleableGroup { return &ComponentPackCollection{} },
	(&ComponentVariantCollection{}).GetBundleFolderName():   func() BundleableGroup { return &ComponentVariantCollection{} },
	(&UserFileCollectionCollection{}).GetBundleFolderName(): func() BundleableGroup { return &UserFileCollectionCollection{} },
	(&FeatureFlagCollection{}).GetBundleFolderName():        func() BundleableGroup { return &FeatureFlagCollection{} },
	(&LabelCollection{}).GetBundleFolderName():              func() BundleableGroup { return &LabelCollection{} },
	(&TranslationCollection{}).GetBundleFolderName():        func() BundleableGroup { return &TranslationCollection{} },
	(&AuthSourceCollection{}).GetBundleFolderName():         func() BundleableGroup { return &AuthSourceCollection{} },
	(&UserAccessTokenCollection{}).GetBundleFolderName():    func() BundleableGroup { return &UserAccessTokenCollection{} },
	(&SignupMethodCollection{}).GetBundleFolderName():       func() BundleableGroup { return &SignupMethodCollection{} },
}

func GetBundleableGroupFromType(metadataType string) (BundleableGroup, error) {
	group, ok := bundleableGroupMap[metadataType]
	if !ok {
		return nil, errors.New("Bad metadata type: " + metadataType)
	}
	return group(), nil
}

func GetMetadataTypes() []string {
	types := []string{}
	for key := range bundleableGroupMap {
		types = append(types, key)
	}
	return types
}

func Copy(to, from interface{}) {
	reflect.Indirect(reflect.ValueOf(to)).Set(reflect.Indirect(reflect.ValueOf(from)))
}

var validMetaRegex, _ = regexp.Compile("^[a-z0-9_]+$")

func IsValidMetadataName(name string) bool {
	return validMetaRegex.MatchString(name)
}

func validateNodeLanguage(node *yaml.Node, expectedName string) error {
	node.SkipCustom = true
	name := getNodeValueAsString(node, "language")
	if name != expectedName {
		return fmt.Errorf("Metadata name does not match filename: %s, %s", name, expectedName)
	}
	if !IsValidMetadataName(name) {
		return fmt.Errorf("Failed metadata validation, no capital letters or special characters allowed: %s", name)
	}
	return nil
}

func validateNodeName(node *yaml.Node, expectedName string) error {
	node.SkipCustom = true
	name := getNodeValueAsString(node, "name")
	if name != expectedName {
		return fmt.Errorf("Metadata name does not match filename: %s, %s", name, expectedName)
	}
	if !IsValidMetadataName(name) {
		return fmt.Errorf("Failed metadata validation, no capital letters or special characters allowed: %s", name)
	}
	return nil
}

func validateRequiredMetadataItem(node *yaml.Node, property string) error {
	value := getNodeValueAsString(node, property)
	if value == "" {
		return fmt.Errorf("Required Metadata Propety Missing: %s", property)
	}
	namespace, _, err := ParseKey(value)
	if err != nil {
		return fmt.Errorf("Invalid Metadata Property: %s, %s", property, value)
	}
	_, _, err = ParseNamespace(namespace)
	if err != nil {
		return fmt.Errorf("Invalid Namespace for Metadata Property: %s, %s", property, value)
	}
	return nil
}

func getNodeValueAsString(node *yaml.Node, key string) string {
	keyNode, err := getMapNode(node, key)
	if err != nil {
		return ""
	}
	if keyNode.Kind != yaml.ScalarNode {
		return ""
	}
	return keyNode.Value
}

func addNodeToMap(mapNode *yaml.Node, key string, valueNode *yaml.Node) {
	newKeyNode := &yaml.Node{}
	newKeyNode.SetString(key)
	mapNode.Content = append(mapNode.Content, newKeyNode, valueNode)
}

func getOrCreateMapNode(node *yaml.Node, key string) (*yaml.Node, error) {
	subNode, err := getMapNode(node, key)
	if err != nil {
		newValueNode := &yaml.Node{}
		_ = newValueNode.Encode(&map[string]interface{}{})
		addNodeToMap(node, key, newValueNode)
		// Now try again...
		return newValueNode, nil
	}
	return subNode, nil
}

func getMapNode(node *yaml.Node, key string) (*yaml.Node, error) {
	if node.Kind != yaml.MappingNode {
		return nil, fmt.Errorf("Definition is not a mapping node.")
	}

	for i := range node.Content {
		// Skip every other node to only get keys
		if i%2 == 0 && node.Content[i].Value == key {
			return node.Content[i+1], nil
		}
	}

	return nil, fmt.Errorf("Node not found of key: " + key)
}

func setDefaultValue(node *yaml.Node, key, value string) error {
	existing := getNodeValueAsString(node, key)
	if existing != "" {
		return nil
	}
	return setMapNode(node, key, value)
}

func setMapNode(node *yaml.Node, key, value string) error {
	if node.Kind != yaml.MappingNode {
		return fmt.Errorf("Definition is not a mapping node.")
	}

	for i := range node.Content {
		// Skip every other node to only get keys
		if i%2 == 0 && node.Content[i].Value == key {
			node.Content[i+1].SetString(value)
			return nil
		}
	}

	newValueNode := &yaml.Node{}
	newValueNode.SetString(value)
	addNodeToMap(node, key, newValueNode)

	return nil
}

type YAMLDefinition yaml.Node

func (yd *YAMLDefinition) MarshalJSONArray(enc *gojay.Encoder) {
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
