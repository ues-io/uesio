package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/reflecttools"
)

// BundleConditions type
type BundleConditions map[string]string

// CollectionableGroup interface
type CollectionableGroup interface {
	adapters.LoadableGroup
	GetName() string
	GetFields() []adapters.LoadRequestField
}

// CollectionableItem interface
type CollectionableItem interface {
	adapters.LoadableItem
	GetCollectionName() string
	GetCollection() CollectionableGroup
}

// BundleableGroup interface
type BundleableGroup interface {
	CollectionableGroup
	GetKeyPrefix(BundleConditions) string
	NewBundleableItem() BundleableItem
	NewBundleableItemWithKey(key string) (BundleableItem, error)
}

// BundleableItem interface
type BundleableItem interface {
	CollectionableItem
	GetBundleGroup() BundleableGroup
	GetPermChecker() *PermissionSet
	GetKey() string
	GetConditions() ([]adapters.LoadRequestCondition, error)
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

// StandardGetFields function
func StandardGetFields(group CollectionableGroup) []adapters.LoadRequestField {
	fieldRequests := []adapters.LoadRequestField{}
	names, err := reflecttools.GetFieldNames(group.NewItem())
	if err != nil {
		return fieldRequests
	}
	for _, name := range names {
		fieldRequests = append(fieldRequests, adapters.LoadRequestField{
			ID: name,
		})
	}
	return fieldRequests
}

// StandardFieldGet function
func StandardFieldGet(item CollectionableItem, fieldName string) (interface{}, error) {
	return reflecttools.GetField(item, fieldName)
}

// StandardFieldSet function
func StandardFieldSet(item CollectionableItem, fieldName string, value interface{}) error {
	return reflecttools.SetField(item, fieldName, value)
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
