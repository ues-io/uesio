package meta

import (
	"errors"
	"fmt"
	"time"

	language "golang.org/x/text/language"
	"gopkg.in/yaml.v3"
)

type Translation struct {
	ID        string            `yaml:"-" json:"uesio/core.id"`
	UniqueKey string            `yaml:"-" json:"uesio/core.uniquekey"`
	Namespace string            `yaml:"-" json:"-"`
	Workspace *Workspace        `yaml:"-" json:"uesio/studio.workspace"`
	Labels    map[string]string `yaml:"labels" json:"uesio/studio.labels"`
	Language  string            `yaml:"language" json:"uesio/studio.language"`
	itemMeta  *ItemMeta         `yaml:"-" json:"-"`
	CreatedBy *User             `yaml:"-" json:"uesio/core.createdby"`
	Owner     *User             `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy *User             `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt int64             `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt int64             `yaml:"-" json:"uesio/core.createdat"`
	Public    bool              `yaml:"public,omitempty" json:"uesio/studio.public"`
}

type TranslationWrapper Translation

func NewTranslation(key string) (*Translation, error) {
	namespace, languageISO, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Translation: " + key)
	}

	_, err = language.ParseBase(languageISO)
	if err != nil {
		return nil, errors.New("Invalid ISO 639 Key: " + key)
	}

	return &Translation{
		Namespace: namespace,
		Language:  languageISO,
	}, nil
}

func (t *Translation) GetBundleGroup() BundleableGroup {
	return &TranslationCollection{}
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
	return &TranslationCollection{}
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
	return node.Decode((*TranslationWrapper)(t))
}

func (t *Translation) IsPublic() bool {
	return t.Public
}
