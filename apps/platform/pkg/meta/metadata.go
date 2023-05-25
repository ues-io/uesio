package meta

import (
	"errors"
	"fmt"
	"os"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/francoispqt/gojay"
	"github.com/thecloudmasters/uesio/pkg/reflecttool"
	"gopkg.in/yaml.v3"
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

type BuiltIn struct {
	ID        string    `yaml:"-" json:"uesio/core.id"`
	UniqueKey string    `yaml:"-" json:"uesio/core.uniquekey"`
	itemMeta  *ItemMeta `yaml:"-" json:"-"`
	CreatedBy *User     `yaml:"-" json:"uesio/core.createdby"`
	Owner     *User     `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy *User     `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt int64     `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt int64     `yaml:"-" json:"uesio/core.createdat"`
}

func (bi *BuiltIn) SetModified(mod time.Time) {
	bi.UpdatedAt = mod.Unix()
}

func (bi *BuiltIn) GetItemMeta() *ItemMeta {
	return bi.itemMeta
}

func (bi *BuiltIn) SetItemMeta(itemMeta *ItemMeta) {
	bi.itemMeta = itemMeta
}

type BundleConditions map[string]string

type CollectionableGroup interface {
	Group
	GetName() string
	GetFields() []string
}

type CollectionableItem interface {
	Item
	GetCollectionName() string
	GetItemMeta() *ItemMeta
	SetItemMeta(*ItemMeta)
}

type BundleableGroup interface {
	CollectionableGroup
	GetBundleFolderName() string
	FilterPath(string, BundleConditions, bool) bool
	GetItemFromPath(string, string) BundleableItem
}

type AttachableGroup interface {
	BundleableGroup
	IsDefinitionPath(string) bool
}

type AttachableItem interface {
	BundleableItem
	GetBasePath() string
}

type BundleableItem interface {
	CollectionableItem
	GetBundleFolderName() string
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

func ParseKeyWithDefault(key, defaultNamespace string) (string, string, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) == 2 {
		return keyArray[0], keyArray[1], nil
	}
	if len(keyArray) == 1 {
		return defaultNamespace, key, nil
	}
	return "", "", errors.New("Invalid Key With Default: " + key)
}

func ParseNamespace(namespace string) (string, string, error) {
	keyArray := strings.Split(namespace, "/")
	if len(keyArray) != 2 {
		return "", "", errors.New("Invalid Namespace: " + namespace)
	}
	return keyArray[0], keyArray[1], nil
}

func StandardPathFilter(path string) bool {
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 1 || !strings.HasSuffix(parts[0], ".yaml") {
		// Ignore this file
		return false
	}
	return true
}

func StandardNameFromPath(path string) string {
	return strings.TrimSuffix(path, ".yaml")
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
	err := reflecttool.SetField(item, fieldName, value)
	if err != nil {
		return errors.New("Failed to set field: " + fieldName + " on item: " + item.GetCollectionName())
	}
	return nil
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

var METADATA_NAME_MAP = map[string]string{
	"COLLECTION":       "collections",
	"FIELD":            "fields",
	"VIEW":             "views",
	"DATASOURCE":       "datasources",
	"AUTHSOURCE":       "authsources",
	"SIGNUPMETHOD":     "signupmethods",
	"SECRET":           "secrets",
	"THEME":            "themes",
	"SELECTLIST":       "selectlists",
	"BOT":              "bots",
	"CREDENTIALS":      "credentials",
	"ROUTE":            "routes",
	"PROFILE":          "profiles",
	"PERMISSIONSET":    "permissionsets",
	"COMPONENTVARIANT": "componentvariants",
	"COMPONENTPACK":    "componentpacks",
	"COMPONENT":        "components",
	"FILE":             "files",
	"LABEL":            "labels",
	"INTEGRATION":      "integrations",
}

var bundleableGroupMap = map[string]BundleableFactory{
	(&SecretCollection{}).GetBundleFolderName():           func() BundleableGroup { return &SecretCollection{} },
	(&ProfileCollection{}).GetBundleFolderName():          func() BundleableGroup { return &ProfileCollection{} },
	(&PermissionSetCollection{}).GetBundleFolderName():    func() BundleableGroup { return &PermissionSetCollection{} },
	(&ConfigValueCollection{}).GetBundleFolderName():      func() BundleableGroup { return &ConfigValueCollection{} },
	(&DataSourceCollection{}).GetBundleFolderName():       func() BundleableGroup { return &DataSourceCollection{} },
	(&FileSourceCollection{}).GetBundleFolderName():       func() BundleableGroup { return &FileSourceCollection{} },
	(&FileCollection{}).GetBundleFolderName():             func() BundleableGroup { return &FileCollection{} },
	(&FieldCollection{}).GetBundleFolderName():            func() BundleableGroup { return &FieldCollection{} },
	(&BotCollection{}).GetBundleFolderName():              func() BundleableGroup { return &BotCollection{} },
	(&CollectionCollection{}).GetBundleFolderName():       func() BundleableGroup { return &CollectionCollection{} },
	(&SelectListCollection{}).GetBundleFolderName():       func() BundleableGroup { return &SelectListCollection{} },
	(&RouteCollection{}).GetBundleFolderName():            func() BundleableGroup { return &RouteCollection{} },
	(&RouteAssignmentCollection{}).GetBundleFolderName():  func() BundleableGroup { return &RouteAssignmentCollection{} },
	(&ViewCollection{}).GetBundleFolderName():             func() BundleableGroup { return &ViewCollection{} },
	(&ThemeCollection{}).GetBundleFolderName():            func() BundleableGroup { return &ThemeCollection{} },
	(&CredentialCollection{}).GetBundleFolderName():       func() BundleableGroup { return &CredentialCollection{} },
	(&ComponentPackCollection{}).GetBundleFolderName():    func() BundleableGroup { return &ComponentPackCollection{} },
	(&ComponentVariantCollection{}).GetBundleFolderName(): func() BundleableGroup { return &ComponentVariantCollection{} },
	(&FeatureFlagCollection{}).GetBundleFolderName():      func() BundleableGroup { return &FeatureFlagCollection{} },
	(&LabelCollection{}).GetBundleFolderName():            func() BundleableGroup { return &LabelCollection{} },
	(&TranslationCollection{}).GetBundleFolderName():      func() BundleableGroup { return &TranslationCollection{} },
	(&AuthSourceCollection{}).GetBundleFolderName():       func() BundleableGroup { return &AuthSourceCollection{} },
	(&UserAccessTokenCollection{}).GetBundleFolderName():  func() BundleableGroup { return &UserAccessTokenCollection{} },
	(&SignupMethodCollection{}).GetBundleFolderName():     func() BundleableGroup { return &SignupMethodCollection{} },
	(&IntegrationCollection{}).GetBundleFolderName():      func() BundleableGroup { return &IntegrationCollection{} },
	(&ComponentCollection{}).GetBundleFolderName():        func() BundleableGroup { return &ComponentCollection{} },
	(&UtilityCollection{}).GetBundleFolderName():          func() BundleableGroup { return &UtilityCollection{} },
}

func GetGroupingConditions(metadataType, grouping string) (BundleConditions, error) {
	conditions := BundleConditions{}
	if metadataType == "fields" {
		if grouping == "" {
			return nil, errors.New("metadata type fields requires grouping value")
		}
		conditions["uesio/studio.collection"] = grouping
	} else if metadataType == "bots" {
		conditions["uesio/studio.type"] = grouping
	} else if metadataType == "componentvariants" {
		conditions["uesio/studio.component"] = grouping
	}
	return conditions, nil
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
	name := GetNodeValueAsString(node, "language")
	if name != expectedName {
		return fmt.Errorf("Metadata name does not match filename: %s, %s", name, expectedName)
	}
	if !IsValidMetadataName(name) {
		return fmt.Errorf("Failed metadata validation, no capital letters or special characters allowed: %s", name)
	}
	return nil
}

func validateNodeName(node *yaml.Node, expectedName string) error {
	name := GetNodeValueAsString(node, "name")
	if name != expectedName {
		return fmt.Errorf("Metadata name does not match filename: %s, %s", name, expectedName)
	}
	if !IsValidMetadataName(name) {
		return fmt.Errorf("Failed metadata validation, no capital letters or special characters allowed: %s", name)
	}
	return nil
}

func validateRequiredMetadataItem(node *yaml.Node, property string) error {
	value := GetNodeValueAsString(node, property)
	if value == "" {
		return fmt.Errorf("Required Metadata Property Missing: %s", property)
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

func GetNodeValueAsString(node *yaml.Node, key string) string {
	keyNode, err := GetMapNode(node, key)
	if err != nil {
		return ""
	}
	if keyNode.Kind != yaml.ScalarNode {
		return ""
	}
	return keyNode.Value
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

func addNodeToMap(mapNode *yaml.Node, key string, valueNode *yaml.Node) {
	newKeyNode := &yaml.Node{}
	newKeyNode.SetString(key)
	mapNode.Content = append(mapNode.Content, newKeyNode, valueNode)
}

func getOrCreateMapNode(node *yaml.Node, key string) (*yaml.Node, error) {
	subNode, err := GetMapNode(node, key)
	if err != nil {
		newValueNode := &yaml.Node{}
		_ = newValueNode.Encode(&map[string]interface{}{})
		addNodeToMap(node, key, newValueNode)
		// Now try again...
		return newValueNode, nil
	}
	return subNode, nil
}

type NodePair struct {
	Node *yaml.Node
	Key  string
}

func GetMapNodes(node *yaml.Node) ([]NodePair, error) {
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
	existing := GetNodeValueAsString(node, key)
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

	// If we didn't find the node, then add it
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
