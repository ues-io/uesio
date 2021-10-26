package meta

import (
	"errors"

	"github.com/humandad/yaml"
)

// type FeatureFlagOption struct {
// 	Scope string `uesio:"studio.scope" json:"scope"`
// 	Value string `uesio:"studio.value" json:"value"`
// }

// FeatureFlag struct
type FeatureFlag struct {
	ID        string `yaml:"-" uesio:"uesio.id"`
	Name      string `yaml:"name" uesio:"studio.name"`
	Namespace string `yaml:"-" uesio:"-"`
	// Options   []FeatureFlagOption `yaml:"options" uesio:"studio.options"`
	// Restrict  []string            `yaml:"restrict" uesio:"studio.restrict"`
	Workspace *Workspace `yaml:"-" uesio:"studio.workspace"`
	itemMeta  *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy *User      `yaml:"-" uesio:"uesio.createdby"`
	Owner     *User      `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy *User      `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt int64      `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt int64      `yaml:"-" uesio:"uesio.createdat"`
}

// NewFeatureFlag function
func NewFeatureFlag(key string) (*FeatureFlag, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for FeatureFlag: " + key)
	}
	return &FeatureFlag{
		Name:      name,
		Namespace: namespace,
	}, nil
}

// GetCollectionName function
func (cv *FeatureFlag) GetCollectionName() string {
	return cv.GetBundleGroup().GetName()
}

// GetCollection function
func (cv *FeatureFlag) GetCollection() CollectionableGroup {
	var cvc FeatureFlagCollection
	return &cvc
}

// GetConditions function
func (cv *FeatureFlag) GetConditions() map[string]string {
	return map[string]string{
		"studio.name": cv.Name,
	}
}

// GetBundleGroup function
func (cv *FeatureFlag) GetBundleGroup() BundleableGroup {
	var cvc FeatureFlagCollection
	return &cvc
}

// GetKey function
func (cv *FeatureFlag) GetKey() string {
	return cv.Namespace + "." + cv.Name
}

// GetPath function
func (cv *FeatureFlag) GetPath() string {
	return cv.GetKey() + ".yaml"
}

// GetPermChecker function
func (cv *FeatureFlag) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (cv *FeatureFlag) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(cv, fieldName, value)
}

// GetField function
func (cv *FeatureFlag) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(cv, fieldName)
}

// GetNamespace function
func (cv *FeatureFlag) GetNamespace() string {
	return cv.Namespace
}

// SetNamespace function
func (cv *FeatureFlag) SetNamespace(namespace string) {
	cv.Namespace = namespace
}

// SetWorkspace function
func (cv *FeatureFlag) SetWorkspace(workspace string) {
	cv.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (cv *FeatureFlag) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(cv, iter)
}

// Len function
func (cv *FeatureFlag) Len() int {
	return StandardItemLen(cv)
}

// GetItemMeta function
func (cv *FeatureFlag) GetItemMeta() *ItemMeta {
	return cv.itemMeta
}

// SetItemMeta function
func (cv *FeatureFlag) SetItemMeta(itemMeta *ItemMeta) {
	cv.itemMeta = itemMeta
}

func (cv *FeatureFlag) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, cv.Name)
	if err != nil {
		return err
	}
	return node.Decode(cv)
}
