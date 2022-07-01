package meta

import (
	"fmt"
	"time"

	"github.com/humandad/yaml"
)

type Translation struct {
	ID        string            `yaml:"-" uesio:"uesio/core.id"`
	UniqueKey string            `yaml:"-" uesio:"uesio/core.uniquekey"`
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
	Public    bool              `yaml:"public,omitempty" uesio:"uesio/studio.public"`
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
	return fmt.Sprintf("%s:%s", workspace, t.Language)
}

func (t *Translation) SetNamespace(namespace string) {
	t.Namespace = namespace
}

func (t *Translation) GetNamespace() string {
	return t.Namespace
}

func (t *Translation) SetModified(mod time.Time) {
	t.UpdatedAt = mod.UnixMilli()
}

func (t *Translation) GetCollectionName() string {
	return t.GetCollection().GetName()
}

func (t *Translation) GetCollection() CollectionableGroup {
	var tc TranslationCollection
	return &tc
}

func (t *Translation) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(t, fieldName, value)
}

func (t *Translation) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(t, fieldName)
}

func (t *Translation) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(t, iter)
}

func (t *Translation) Len() int {
	return StandardItemLen(t)
}

func (t *Translation) GetItemMeta() *ItemMeta {
	return t.itemMeta
}

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

func (t *Translation) IsPublic() bool {
	return t.Public
}
