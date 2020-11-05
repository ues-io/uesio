package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/reqs"

	"github.com/mitchellh/mapstructure"
)

// CollectionableGroup interface
type CollectionableGroup interface {
	GetName() string
	GetFields() []string
	UnMarshal(data []map[string]interface{}) error
	Marshal() ([]map[string]interface{}, error)
	GetItem(index int) CollectionableItem
}

// CollectionableItem interface
type CollectionableItem interface {
	GetCollectionName() string
	GetCollection() CollectionableGroup
	GetConditions() ([]reqs.LoadRequestCondition, error)
	SetNamespace(string)
	GetNamespace() string
	SetWorkspace(string)
	GetKey() string
}

// BundleableGroup interface
type BundleableGroup interface {
	CollectionableGroup
	NewItem(key string) (BundleableItem, error)
	AddItem(BundleableItem)
	GetKeyPrefix(reqs.BundleConditions) string
}

// BundleableItem interface
type BundleableItem interface {
	CollectionableItem
	GetBundleGroup() BundleableGroup
	GetPermChecker() *PermissionSet
}

// ParseKey function
func ParseKey(key string) (string, string, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return "", "", errors.New("Invalid Key: " + key)
	}
	return keyArray[0], keyArray[1], nil
}

// StandardDecoder function
func StandardDecoder(group CollectionableGroup, data []map[string]interface{}) error {
	return decode(data, group)
}

// StandardEncoder function
func StandardEncoder(group CollectionableGroup) ([]map[string]interface{}, error) {
	var data []map[string]interface{}
	err := decode(group, &data)
	if err != nil {
		return nil, err
	}
	return data, nil
}

func decode(in interface{}, out interface{}) error {
	config := &mapstructure.DecoderConfig{
		Result:  out,
		TagName: "uesio",
	}

	decoder, err := mapstructure.NewDecoder(config)
	if err != nil {
		return err
	}

	if err := decoder.Decode(in); err != nil {
		return err
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
