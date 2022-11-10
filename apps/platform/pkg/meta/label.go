package meta

import (
	"errors"
	"fmt"
	"time"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type Label struct {
	ID        string     `yaml:"-" json:"uesio/core.id"`
	UniqueKey string     `yaml:"-" json:"uesio/core.uniquekey"`
	Name      string     `yaml:"name" json:"uesio/studio.name"`
	Value     string     `yaml:"value" json:"uesio/studio.value"`
	Namespace string     `yaml:"-" json:"-"`
	Workspace *Workspace `yaml:"-" json:"uesio/studio.workspace"`
	itemMeta  *ItemMeta  `yaml:"-" json:"-"`
	CreatedBy *User      `yaml:"-" json:"uesio/core.createdby"`
	Owner     *User      `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy *User      `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt int64      `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt int64      `yaml:"-" json:"uesio/core.createdat"`
	Public    bool       `yaml:"public,omitempty" json:"uesio/studio.public"`
}

type LabelWrapper Label

func (l *Label) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(l)
}

func (l *Label) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("namespace", l.Namespace)
	enc.AddStringKey("name", l.Name)
	enc.AddStringKey("value", l.Value)
}

func (l *Label) IsNil() bool {
	return l == nil
}

func NewLabel(key string) (*Label, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Label: " + key)
	}
	return &Label{
		Name:      name,
		Namespace: namespace,
	}, nil
}

func NewLabels(keys map[string]bool) ([]BundleableItem, error) {
	items := []BundleableItem{}

	for key := range keys {
		newLabel, err := NewLabel(key)
		if err != nil {
			return nil, err
		}
		items = append(items, newLabel)
	}

	return items, nil
}

func (l *Label) GetCollectionName() string {
	return l.GetBundleGroup().GetName()
}

func (l *Label) GetCollection() CollectionableGroup {
	return &LabelCollection{}
}

func (l *Label) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, l.Name)
}

func (l *Label) GetBundleGroup() BundleableGroup {
	return &LabelCollection{}
}

func (l *Label) GetKey() string {
	return fmt.Sprintf("%s.%s", l.Namespace, l.Name)
}

func (l *Label) GetPath() string {
	return l.Name + ".yaml"
}

func (l *Label) GetPermChecker() *PermissionSet {
	return nil
}

func (l *Label) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(l, fieldName, value)
}

func (l *Label) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(l, fieldName)
}

func (l *Label) GetNamespace() string {
	return l.Namespace
}

func (l *Label) SetNamespace(namespace string) {
	l.Namespace = namespace
}

func (l *Label) SetModified(mod time.Time) {
	l.UpdatedAt = mod.UnixMilli()
}

func (l *Label) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(l, iter)
}

func (l *Label) Len() int {
	return StandardItemLen(l)
}

func (l *Label) GetItemMeta() *ItemMeta {
	return l.itemMeta
}

func (l *Label) SetItemMeta(itemMeta *ItemMeta) {
	l.itemMeta = itemMeta
}

func (l *Label) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, l.Name)
	if err != nil {
		return err
	}
	return node.Decode((*LabelWrapper)(l))
}

func (l *Label) IsPublic() bool {
	return l.Public
}
