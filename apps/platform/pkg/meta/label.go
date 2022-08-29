package meta

import (
	"errors"
	"fmt"
	"time"

	"github.com/francoispqt/gojay"
	"github.com/humandad/yaml"
)

type Label struct {
	ID        string     `yaml:"-" uesio:"uesio/core.id"`
	UniqueKey string     `yaml:"-" uesio:"uesio/core.uniquekey"`
	Name      string     `yaml:"name" uesio:"uesio/studio.name"`
	Value     string     `yaml:"value" uesio:"uesio/studio.value"`
	Namespace string     `yaml:"-" uesio:"-"`
	Workspace *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	itemMeta  *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64      `yaml:"-" uesio:"uesio/core.createdat"`
	Public    bool       `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

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
	var lc LabelCollection
	return &lc
}

func (l *Label) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, l.Name)
}

func (l *Label) GetBundleGroup() BundleableGroup {
	var lc LabelCollection
	return &lc
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
	return node.Decode(l)
}

func (l *Label) IsPublic() bool {
	return l.Public
}
