package meta

import (
	"path/filepath"

	"github.com/humandad/yaml"
)

// Translation struct
type Translation struct {
	ID        string            `yaml:"-" uesio:"uesio.id"`
	Namespace string            `yaml:"-" uesio:"-"`
	Workspace *Workspace        `yaml:"-" uesio:"studio.workspace"`
	LabelRefs map[string]string `yaml:"labels" uesio:"studio.labelrefs"`
	Language  string            `yaml:"language" uesio:"studio.language"`
	itemMeta  *ItemMeta         `yaml:"-" uesio:"-"`
	CreatedBy *User             `yaml:"-" uesio:"uesio.createdby"`
	Owner     *User             `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy *User             `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt int64             `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt int64             `yaml:"-" uesio:"uesio.createdat"`
}

func (t *Translation) GetBundleGroup() BundleableGroup {
	var tc TranslationCollection
	return &tc
}

func (t *Translation) GetPermChecker() *PermissionSet {
	return nil
}

func (t *Translation) GetKey() string {
	return t.Language + "." + t.Namespace
}

func (t *Translation) GetPath() string {
	return filepath.Join(t.Language, "file.yaml")

}

func (t *Translation) GetConditions() map[string]string {
	return map[string]string{
		"studio.language": t.Language,
	}
}

func (t *Translation) SetNamespace(namespace string) {
	t.Namespace = namespace
}

func (t *Translation) GetNamespace() string {
	return t.Namespace
}

func (t *Translation) SetWorkspace(workspace string) {
	t.Workspace = &Workspace{
		ID: workspace,
	}
}

// GetCollectionName function
func (t *Translation) GetCollectionName() string {
	return t.GetCollection().GetName()
}

// GetCollection function
func (t *Translation) GetCollection() CollectionableGroup {
	var sc TranslationCollection
	return &sc
}

// SetField function
func (t *Translation) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(t, fieldName, value)
}

// GetField function
func (t *Translation) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(t, fieldName)
}

// Loop function
func (t *Translation) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(t, iter)
}

// Len function
func (t *Translation) Len() int {
	return StandardItemLen(t)
}

// GetItemMeta function
func (t *Translation) GetItemMeta() *ItemMeta {
	return t.itemMeta
}

// SetItemMeta function
func (t *Translation) SetItemMeta(itemMeta *ItemMeta) {
	t.itemMeta = itemMeta
}

func (t *Translation) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeLanguage(node, t.Language)
	if err != nil {
		return err
	}
	return node.Decode(t)
}
