package meta

import (
	"errors"
	"fmt"

	"gopkg.in/yaml.v3"
)

type SelectListOption struct {
	Label string `yaml:"label" json:"label" json:"label"`
	Value string `yaml:"value" json:"value" json:"value"`
}

type SelectList struct {
	Name             string             `yaml:"name" json:"uesio/studio.name"`
	Options          []SelectListOption `yaml:"options" json:"uesio/studio.options"`
	BlankOptionLabel string             `yaml:"blank_option_label,omitempty" json:"uesio/studio.blank_option_label"`
	BuiltIn
	BundleableBase `yaml:",inline"`
}

type SelectListWrapper SelectList

func NewSelectList(key string) (*SelectList, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for SelectList: " + key)
	}
	return &SelectList{
		Name: name,
		BundleableBase: BundleableBase{
			Namespace: namespace,
		},
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
	return SELECTLIST_COLLECTION_NAME
}

func (sl *SelectList) GetBundleFolderName() string {
	return SELECTLIST_FOLDER_NAME
}

func (sl *SelectList) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, sl.Name)
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

func (sl *SelectList) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(sl, iter)
}

func (sl *SelectList) Len() int {
	return StandardItemLen(sl)
}

func (sl *SelectList) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, sl.Name)
	if err != nil {
		return err
	}
	return node.Decode((*SelectListWrapper)(sl))
}
