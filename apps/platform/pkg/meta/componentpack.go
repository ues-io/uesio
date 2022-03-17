package meta

import (
	"fmt"
	"path/filepath"

	"github.com/humandad/yaml"
)

// ComponentPack struct
type ComponentPack struct {
	ID              string              `yaml:"-" uesio:"uesio.id"`
	Name            string              `yaml:"name" uesio:"studio.name"`
	Namespace       string              `yaml:"-" uesio:"-"`
	Workspace       *Workspace          `yaml:"-" uesio:"studio.workspace"`
	Components      *ComponentsRegistry `yaml:"components" uesio:"studio.components"`
	RuntimeBundle   *UserFileMetadata   `yaml:"-" uesio:"studio.runtimebundle"`
	BuildTimeBundle *UserFileMetadata   `yaml:"-" uesio:"studio.buildtimebundle"`
	itemMeta        *ItemMeta           `yaml:"-" uesio:"-"`
	CreatedBy       *User               `yaml:"-" uesio:"uesio.createdby"`
	Owner           *User               `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy       *User               `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt       int64               `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt       int64               `yaml:"-" uesio:"uesio.createdat"`
}

type ComponentsRegistry struct {
	ViewComponents    map[string]*ComponentDependencies `yaml:"view"`
	UtilityComponents map[string]*ComponentDependencies `yaml:"utility"`
}

type ComponentDependencies struct {
	ConfigValues []string `yaml:"configvalues"`
	Variants     []string `yaml:"variants"`
	Utilities    []string `yaml:"utilities"`
}

// GetCollectionName function
func (cp *ComponentPack) GetCollectionName() string {
	return cp.GetBundleGroup().GetName()
}

// GetCollection function
func (cp *ComponentPack) GetCollection() CollectionableGroup {
	var cpc ComponentPackCollection
	return &cpc
}

func (cp *ComponentPack) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, cp.Name)
}

// GetBundleGroup function
func (cp *ComponentPack) GetBundleGroup() BundleableGroup {
	var cpc ComponentPackCollection
	return &cpc
}

// GetKey function
func (cp *ComponentPack) GetKey() string {
	return cp.Namespace + "." + cp.Name
}

func (cp *ComponentPack) GetComponentPackFilePath() string {
	return filepath.Join(cp.GetKey(), "runtime.bundle.js")
}

func (cp *ComponentPack) GetBuilderComponentPackFilePath() string {
	return filepath.Join(cp.GetKey(), "builder.bundle.js")
}

// GetPath function
func (cp *ComponentPack) GetPath() string {
	return filepath.Join(cp.GetKey(), "pack.yaml")
}

// GetPermChecker function
func (cp *ComponentPack) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (cp *ComponentPack) SetField(fieldName string, value interface{}) error {
	if fieldName == "studio.components" {
		if value == nil {
			cp.Components = &ComponentsRegistry{}
			return nil
		}
		var components ComponentsRegistry
		err := yaml.Unmarshal([]byte(value.(string)), &components)
		if err != nil {
			return err
		}
		cp.Components = &components

		return nil
	}
	return StandardFieldSet(cp, fieldName, value)
}

// GetField function
func (cp *ComponentPack) GetField(fieldName string) (interface{}, error) {
	if fieldName == "studio.components" {

		bytes, err := yaml.Marshal(&cp.Components)
		if err != nil {
			return nil, err
		}
		return string(bytes), nil

	}
	return StandardFieldGet(cp, fieldName)
}

// GetNamespace function
func (cp *ComponentPack) GetNamespace() string {
	return cp.Namespace
}

// SetNamespace function
func (cp *ComponentPack) SetNamespace(namespace string) {
	cp.Namespace = namespace
}

// SetWorkspace function
func (cp *ComponentPack) SetWorkspace(workspace string) {
	cp.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (cp *ComponentPack) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(cp, iter)
}

// Len function
func (cp *ComponentPack) Len() int {
	return StandardItemLen(cp)
}

// GetItemMeta function
func (cp *ComponentPack) GetItemMeta() *ItemMeta {
	return cp.itemMeta
}

// SetItemMeta function
func (cp *ComponentPack) SetItemMeta(itemMeta *ItemMeta) {
	cp.itemMeta = itemMeta
}

func (cp *ComponentPack) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, cp.Name)
	if err != nil {
		return err
	}
	return node.Decode(cp)
}

// IsPublic function
func (c *ComponentPack) IsPublic() bool {
	return true
}
