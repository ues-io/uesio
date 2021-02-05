package meta

import (
	"errors"
	"os"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/reflecttool"
)

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
	return reflecttool.GetField(item, fieldName)
}

// StandardFieldSet function
func StandardFieldSet(item CollectionableItem, fieldName string, value interface{}) error {
	return reflecttool.SetField(item, fieldName, value)
}

// StandardItemLoop function
func StandardItemLoop(item CollectionableItem, iter func(string, interface{}) error) error {
	for _, fieldName := range StandardGetFields(item) {
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
	"secrets":        func() BundleableGroup { return &SecretCollection{} },
	"profiles":       func() BundleableGroup { return &ProfileCollection{} },
	"permissionsets": func() BundleableGroup { return &PermissionSetCollection{} },
	"configvalues":   func() BundleableGroup { return &ConfigValueCollection{} },
	"datasources":    func() BundleableGroup { return &DataSourceCollection{} },
	"filesources":    func() BundleableGroup { return &FileSourceCollection{} },
	"files":          func() BundleableGroup { return &FileCollection{} },
	"fields":         func() BundleableGroup { return &FieldCollection{} },
	"bots":           func() BundleableGroup { return &BotCollection{} },
	"collections":    func() BundleableGroup { return &CollectionCollection{} },
	"selectlists":    func() BundleableGroup { return &SelectListCollection{} },
	"routes":         func() BundleableGroup { return &RouteCollection{} },
	"views":          func() BundleableGroup { return &ViewCollection{} },
	"themes":         func() BundleableGroup { return &ThemeCollection{} },
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
