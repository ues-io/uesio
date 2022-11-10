package meta

import (
	"errors"
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
)

type SelectListOption struct {
	Label string `yaml:"label" json:"label" json:"label"`
	Value string `yaml:"value" json:"value" json:"value"`
}

type SelectList struct {
	ID               string             `yaml:"-" json:"uesio/core.id"`
	UniqueKey        string             `yaml:"-" json:"uesio/core.uniquekey"`
	Name             string             `yaml:"name" json:"uesio/studio.name"`
	Namespace        string             `yaml:"-" json:"-"`
	Options          []SelectListOption `yaml:"options" json:"uesio/studio.options"`
	BlankOptionLabel string             `yaml:"blank_option_label,omitempty" json:"uesio/studio.blank_option_label"`
	Workspace        *Workspace         `yaml:"-" json:"uesio/studio.workspace"`
	CreatedBy        *User              `yaml:"-" json:"uesio/core.createdby"`
	Owner            *User              `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy        *User              `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt        int64              `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt        int64              `yaml:"-" json:"uesio/core.createdat"`
	itemMeta         *ItemMeta          `yaml:"-" json:"-"`
	Public           bool               `yaml:"public,omitempty" json:"uesio/studio.public"`
}

type SelectListWrapper SelectList

func NewSelectList(key string) (*SelectList, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for SelectList: " + key)
	}
	return &SelectList{
		Name:      name,
		Namespace: namespace,
	}, nil
}

func NewSelectLists(keys map[string]bool) ([]BundleableItem, error) {
	items := []BundleableItem{}

	for key := range keys {
		newSelectList, err := NewSelectList(key)
		if err != nil {
			return nil, err
		}
		items = append(items, newSelectList)
	}

	return items, nil
}

func (sl *SelectList) GetCollectionName() string {
	return sl.GetBundleGroup().GetName()
}

func (sl *SelectList) GetCollection() CollectionableGroup {
	return &SelectListCollection{}
}

func (sl *SelectList) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, sl.Name)
}

func (sl *SelectList) GetBundleGroup() BundleableGroup {
	return &SelectListCollection{}
}

func (sl *SelectList) GetKey() string {
	return fmt.Sprintf("%s.%s", sl.Namespace, sl.Name)
}

func (sl *SelectList) GetPath() string {
	return sl.Name + ".yaml"
}

func (sl *SelectList) GetPermChecker() *PermissionSet {
	return nil
}

func (sl *SelectList) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(sl, fieldName, value)
}

func (sl *SelectList) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(sl, fieldName)
}

func (sl *SelectList) GetNamespace() string {
	return sl.Namespace
}

func (sl *SelectList) SetNamespace(namespace string) {
	sl.Namespace = namespace
}

func (sl *SelectList) SetModified(mod time.Time) {
	sl.UpdatedAt = mod.UnixMilli()
}

func (sl *SelectList) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(sl, iter)
}

func (sl *SelectList) Len() int {
	return StandardItemLen(sl)
}

func (sl *SelectList) GetItemMeta() *ItemMeta {
	return sl.itemMeta
}

func (sl *SelectList) SetItemMeta(itemMeta *ItemMeta) {
	sl.itemMeta = itemMeta
}

func (sl *SelectList) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, sl.Name)
	if err != nil {
		return err
	}
	return node.Decode((*SelectListWrapper)(sl))
}

func (sl *SelectList) IsPublic() bool {
	return sl.Public
}
