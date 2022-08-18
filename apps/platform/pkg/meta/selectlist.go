package meta

import (
	"errors"
	"fmt"
	"time"

	"github.com/humandad/yaml"
)

type SelectListOption struct {
	Label string `yaml:"label" uesio:"label" json:"label"`
	Value string `yaml:"value" uesio:"value" json:"value"`
}

type SelectList struct {
	ID               string             `yaml:"-" uesio:"uesio/core.id"`
	UniqueKey        string             `yaml:"-" uesio:"uesio/core.uniquekey"`
	Name             string             `yaml:"name" uesio:"uesio/studio.name"`
	Namespace        string             `yaml:"-" uesio:"-"`
	Options          []SelectListOption `yaml:"options" uesio:"uesio/studio.options"`
	BlankOptionLabel string             `yaml:"blank_option_label,omitempty" uesio:"uesio/studio.blank_option_label"`
	Workspace        *Workspace         `yaml:"-" uesio:"uesio/studio.workspace"`
	CreatedBy        *User              `yaml:"-" uesio:"uesio/core.createdby"`
	Owner            *User              `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy        *User              `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt        int64              `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt        int64              `yaml:"-" uesio:"uesio/core.createdat"`
	itemMeta         *ItemMeta          `yaml:"-" uesio:"-"`
	Public           bool               `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

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
	var slc SelectListCollection
	return &slc
}

func (sl *SelectList) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, sl.Name)
}

func (sl *SelectList) GetBundleGroup() BundleableGroup {
	var slc SelectListCollection
	return &slc
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
	return node.Decode(sl)
}

func (sl *SelectList) IsPublic() bool {
	return sl.Public
}
