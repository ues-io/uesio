package meta

import (
	"fmt"

	"github.com/humandad/yaml"
)

// Translation struct
type Translation struct {
	ID        string            `yaml:"-" uesio:"uesio/core.id"`
	Namespace string            `yaml:"-" uesio:"-"`
	Workspace *Workspace        `yaml:"-" uesio:"uesio/studio.workspace"`
	Labels    map[string]string `yaml:"labels" uesio:"uesio/studio.labels"`
	Language  string            `yaml:"language" uesio:"uesio/studio.language"`
	itemMeta  *ItemMeta         `yaml:"-" uesio:"-"`
	CreatedBy *User             `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User             `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User             `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64             `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64             `yaml:"-" uesio:"uesio/core.createdat"`
}

func (t *Translation) GetBundleGroup() BundleableGroup {
	var tc TranslationCollection
	return &tc
}

func (t *Translation) GetPermChecker() *PermissionSet {
	return nil
}

func (t *Translation) GetKey() string {
	return t.Language
}

func (t *Translation) GetPath() string {
	return t.GetKey() + ".yaml"
}

func (t *Translation) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, t.Language)
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
	var tc TranslationCollection
	return &tc
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
