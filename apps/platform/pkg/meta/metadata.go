package meta

import (
	"errors"
	"os"
	"strings"

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

// BundleConditions type
type BundleConditions map[string]string

// CollectionableGroup interface
type CollectionableGroup interface {
	loadable.Group
	GetName() string
	GetFields() []string
}

// CollectionableItem interface
type CollectionableItem interface {
	loadable.Item
	GetCollectionName() string
	GetCollection() CollectionableGroup
	GetItemMeta() *ItemMeta
	SetItemMeta(*ItemMeta)
}

// BundleableGroup interface
type BundleableGroup interface {
	CollectionableGroup
	GetKeyFromPath(string, BundleConditions) (string, error)
	NewBundleableItemWithKey(key string) (BundleableItem, error)
}

// BundleableItem interface
type BundleableItem interface {
	CollectionableItem
	GetBundleGroup() BundleableGroup
	GetPermChecker() *PermissionSet
	GetKey() string
	GetPath() string
	GetConditions() map[string]string
	SetNamespace(string)
	GetNamespace() string
	SetWorkspace(string)
}

// ParseKey function
func ParseKey(key string) (string, string, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return "", "", errors.New("Invalid Key: " + key)
	}
	return keyArray[0], keyArray[1], nil
}

// GetNameKeyPart function
func GetNameKeyPart(key string) string {
	_, name, _ := ParseKey(key)
	return name
}

func StandardKeyFromPath(path string, conditions BundleConditions) (string, error) {
	if len(conditions) > 0 {
		return "", errors.New("Conditions not allowed for this type")
	}
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 1 || !strings.HasSuffix(parts[0], ".yaml") {
		// Ignore this file
		return "", nil
	}
	return strings.TrimSuffix(path, ".yaml"), nil
}

func StandardPathFromKey(key string) string {
	return key + ".yaml"
}

// StandardGetFields function
func StandardGetFields(item CollectionableItem) []string {
	names, err := reflecttool.GetFieldNames(item)
	if err != nil {
		return []string{}
	}
	return names
}

// StandardFieldGet function
func StandardFieldGet(item CollectionableItem, fieldName string) (interface{}, error) {
	itemMeta := item.GetItemMeta()
	if itemMeta != nil && !itemMeta.IsValidField(fieldName) {
		return nil, errors.New("Field Not Found: " + fieldName)
	}
	return reflecttool.GetField(item, fieldName)
}

// StandardFieldSet function
func StandardFieldSet(item CollectionableItem, fieldName string, value interface{}) error {
	return reflecttool.SetField(item, fieldName, value)
}

// StandardItemLoop function
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

// BundleableFactory function type
type BundleableFactory func() BundleableGroup

var bundleableGroupMap = map[string]BundleableFactory{
	GetNameKeyPart((&SecretCollection{}).GetName()):             func() BundleableGroup { return &SecretCollection{} },
	GetNameKeyPart((&ProfileCollection{}).GetName()):            func() BundleableGroup { return &ProfileCollection{} },
	GetNameKeyPart((&PermissionSetCollection{}).GetName()):      func() BundleableGroup { return &PermissionSetCollection{} },
	GetNameKeyPart((&ConfigValueCollection{}).GetName()):        func() BundleableGroup { return &ConfigValueCollection{} },
	GetNameKeyPart((&DataSourceCollection{}).GetName()):         func() BundleableGroup { return &DataSourceCollection{} },
	GetNameKeyPart((&FileSourceCollection{}).GetName()):         func() BundleableGroup { return &FileSourceCollection{} },
	GetNameKeyPart((&FileCollection{}).GetName()):               func() BundleableGroup { return &FileCollection{} },
	GetNameKeyPart((&FieldCollection{}).GetName()):              func() BundleableGroup { return &FieldCollection{} },
	GetNameKeyPart((&BotCollection{}).GetName()):                func() BundleableGroup { return &BotCollection{} },
	GetNameKeyPart((&CollectionCollection{}).GetName()):         func() BundleableGroup { return &CollectionCollection{} },
	GetNameKeyPart((&SelectListCollection{}).GetName()):         func() BundleableGroup { return &SelectListCollection{} },
	GetNameKeyPart((&RouteCollection{}).GetName()):              func() BundleableGroup { return &RouteCollection{} },
	GetNameKeyPart((&ViewCollection{}).GetName()):               func() BundleableGroup { return &ViewCollection{} },
	GetNameKeyPart((&ThemeCollection{}).GetName()):              func() BundleableGroup { return &ThemeCollection{} },
	GetNameKeyPart((&CredentialCollection{}).GetName()):         func() BundleableGroup { return &CredentialCollection{} },
	GetNameKeyPart((&ComponentPackCollection{}).GetName()):      func() BundleableGroup { return &ComponentPackCollection{} },
	GetNameKeyPart((&ComponentVariantCollection{}).GetName()):   func() BundleableGroup { return &ComponentVariantCollection{} },
	GetNameKeyPart((&UserFileCollectionCollection{}).GetName()): func() BundleableGroup { return &UserFileCollectionCollection{} },
}

// GetBundleableGroupFromType function
func GetBundleableGroupFromType(metadataType string) (BundleableGroup, error) {
	group, ok := bundleableGroupMap[metadataType]
	if !ok {
		return nil, errors.New("Bad metadata type: " + metadataType)
	}
	return group(), nil
}

// GetMetadataTypes function
func GetMetadataTypes() []string {
	types := []string{}
	for key := range bundleableGroupMap {
		types = append(types, key)
	}
	return types
}
