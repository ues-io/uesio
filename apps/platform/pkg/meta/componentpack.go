package meta

import (
	"fmt"
	"path/filepath"
	"time"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type ComponentPack struct {
	ID              string              `yaml:"-" uesio:"uesio/core.id"`
	UniqueKey       string              `yaml:"-" uesio:"uesio/core.uniquekey"`
	Name            string              `yaml:"name" uesio:"uesio/studio.name"`
	Namespace       string              `yaml:"-" uesio:"-"`
	Workspace       *Workspace          `yaml:"-" uesio:"uesio/studio.workspace"`
	Components      *ComponentsRegistry `yaml:"components" uesio:"uesio/studio.components"`
	RuntimeBundle   *UserFileMetadata   `yaml:"-" uesio:"uesio/studio.runtimebundle"`
	BuildTimeBundle *UserFileMetadata   `yaml:"-" uesio:"uesio/studio.buildtimebundle"`
	itemMeta        *ItemMeta           `yaml:"-" uesio:"-"`
	CreatedBy       *User               `yaml:"-" uesio:"uesio/core.createdby"`
	Owner           *User               `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy       *User               `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt       int64               `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt       int64               `yaml:"-" uesio:"uesio/core.createdat"`
	Public          bool                `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

type ComponentPackWrapper ComponentPack

func (cp *ComponentPack) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(cp)
}

func (cp *ComponentPack) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("namespace", cp.Namespace)
	enc.AddStringKey("name", cp.Name)
}

func (cp *ComponentPack) IsNil() bool {
	return cp == nil
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

func (cp *ComponentPack) GetCollectionName() string {
	return cp.GetBundleGroup().GetName()
}

func (cp *ComponentPack) GetCollection() CollectionableGroup {
	var cpc ComponentPackCollection
	return &cpc
}

func (cp *ComponentPack) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, cp.Name)
}

func (cp *ComponentPack) GetBundleGroup() BundleableGroup {
	var cpc ComponentPackCollection
	return &cpc
}

func (cp *ComponentPack) GetKey() string {
	return fmt.Sprintf("%s.%s", cp.Namespace, cp.Name)
}

func (cp *ComponentPack) GetComponentPackFilePath(buildMode bool) string {
	fileName := "runtime.js"
	if buildMode {
		fileName = "builder.js"
	}
	return filepath.Join(cp.Name, fileName)
}

func (cp *ComponentPack) GetPath() string {
	return filepath.Join(cp.Name, "pack.yaml")
}

func (cp *ComponentPack) GetPermChecker() *PermissionSet {
	return nil
}

func (cp *ComponentPack) SetField(fieldName string, value interface{}) error {
	if fieldName == "uesio/studio.components" {
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

func (cp *ComponentPack) GetField(fieldName string) (interface{}, error) {
	if fieldName == "uesio/studio.components" {

		bytes, err := yaml.Marshal(&cp.Components)
		if err != nil {
			return nil, err
		}
		return string(bytes), nil

	}
	return StandardFieldGet(cp, fieldName)
}

func (cp *ComponentPack) GetNamespace() string {
	return cp.Namespace
}

func (cp *ComponentPack) SetNamespace(namespace string) {
	cp.Namespace = namespace
}

func (cp *ComponentPack) SetModified(mod time.Time) {
	cp.UpdatedAt = mod.UnixMilli()
}

func (cp *ComponentPack) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(cp, iter)
}

func (cp *ComponentPack) Len() int {
	return StandardItemLen(cp)
}

func (cp *ComponentPack) GetItemMeta() *ItemMeta {
	return cp.itemMeta
}

func (cp *ComponentPack) SetItemMeta(itemMeta *ItemMeta) {
	cp.itemMeta = itemMeta
}

func (cp *ComponentPack) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, cp.Name)
	if err != nil {
		return err
	}
	return node.Decode((*ComponentPackWrapper)(cp))
}

func (cp *ComponentPack) IsPublic() bool {
	return cp.Public
}
