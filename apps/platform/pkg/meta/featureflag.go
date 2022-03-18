package meta

import (
	"errors"
	"fmt"

	"github.com/humandad/yaml"
)

type FeatureFlag struct {
	ID        string     `yaml:"-" uesio:"uesio.id"`
	Name      string     `yaml:"name" uesio:"studio.name"`
	Namespace string     `yaml:"-" uesio:"-"`
	Workspace *Workspace `yaml:"-" uesio:"studio.workspace"`
	itemMeta  *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy *User      `yaml:"-" uesio:"uesio.createdby"`
	Owner     *User      `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy *User      `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt int64      `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt int64      `yaml:"-" uesio:"uesio.createdat"`
	Public    bool       `yaml:"public" uesio:"studio.public"`
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
func (ff *FeatureFlag) GetCollectionName() string {
	return ff.GetBundleGroup().GetName()
}

// GetCollection function
func (ff *FeatureFlag) GetCollection() CollectionableGroup {
	var ffc FeatureFlagCollection
	return &ffc
}

func (ff *FeatureFlag) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, ff.Name)
}

// GetBundleGroup function
func (ff *FeatureFlag) GetBundleGroup() BundleableGroup {
	var ffc FeatureFlagCollection
	return &ffc
}

// GetKey function
func (ff *FeatureFlag) GetKey() string {
	return ff.Namespace + "." + ff.Name
}

// GetPath function
func (ff *FeatureFlag) GetPath() string {
	return ff.GetKey() + ".yaml"
}

// GetPermChecker function
func (ff *FeatureFlag) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (ff *FeatureFlag) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ff, fieldName, value)
}

// GetField function
func (ff *FeatureFlag) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ff, fieldName)
}

// GetNamespace function
func (ff *FeatureFlag) GetNamespace() string {
	return ff.Namespace
}

// SetNamespace function
func (ff *FeatureFlag) SetNamespace(namespace string) {
	ff.Namespace = namespace
}

// SetWorkspace function
func (ff *FeatureFlag) SetWorkspace(workspace string) {
	ff.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (ff *FeatureFlag) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ff, iter)
}

// Len function
func (ff *FeatureFlag) Len() int {
	return StandardItemLen(ff)
}

// GetItemMeta function
func (ff *FeatureFlag) GetItemMeta() *ItemMeta {
	return ff.itemMeta
}

// SetItemMeta function
func (ff *FeatureFlag) SetItemMeta(itemMeta *ItemMeta) {
	ff.itemMeta = itemMeta
}

func (ff *FeatureFlag) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, ff.Name)
	if err != nil {
		return err
	}
	return node.Decode(ff)
}

// IsPublic function
func (ff *FeatureFlag) IsPublic() bool {
	return ff.Public
}
