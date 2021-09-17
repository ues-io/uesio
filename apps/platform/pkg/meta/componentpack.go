package meta

import (
	"path/filepath"
)

// ComponentPack struct
type ComponentPack struct {
	ID         string             `yaml:"-" uesio:"studio.id"`
	Name       string             `yaml:"name" uesio:"studio.name"`
	Namespace  string             `yaml:"namespace" uesio:"-"`
	Workspace  string             `yaml:"-" uesio:"studio.workspaceid"`
	Components ComponentsRegistry `yaml:"components" uesio:"studio.components"`
	itemMeta   *ItemMeta          `yaml:"-" uesio:"-"`
	CreatedBy  *User              `yaml:"-" uesio:"studio.createdby"`
	UpdatedBy  *User              `yaml:"-" uesio:"studio.updatedby"`
	UpdatedAt  int64              `yaml:"-" uesio:"studio.updatedat"`
	CreatedAt  int64              `yaml:"-" uesio:"studio.createdat"`
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

// GetConditions function
func (cp *ComponentPack) GetConditions() map[string]string {
	return map[string]string{
		"studio.name": cp.Name,
	}
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
	return StandardFieldSet(cp, fieldName, value)
}

// GetField function
func (cp *ComponentPack) GetField(fieldName string) (interface{}, error) {
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
	cp.Workspace = workspace
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
