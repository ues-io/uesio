package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

type SelectListOption struct {
	Label         string `yaml:"label" json:"label"`
	Value         string `yaml:"value" json:"value"`
	LanguageLabel string `yaml:"languageLabel,omitempty" json:"languageLabel"`
	Disabled      bool   `yaml:"disabled,omitempty" json:"disabled"`
}

type SelectList struct {
	BuiltIn                  `yaml:",inline"`
	BundleableBase           `yaml:",inline"`
	Options                  []SelectListOption `yaml:"options" json:"uesio/studio.options"`
	BlankOptionLabel         string             `yaml:"blank_option_label,omitempty" json:"uesio/studio.blank_option_label"`
	BlankOptionLanguageLabel string             `yaml:"blank_option_language_label,omitempty" json:"uesio/studio.blank_option_language_label"`
}

type SelectListWrapper SelectList

func NewSelectList(key string) (*SelectList, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for SelectList: " + key)
	}
	return NewBaseSelectList(namespace, name), nil
}

func NewBaseSelectList(namespace, name string) *SelectList {
	return &SelectList{BundleableBase: NewBase(namespace, name)}
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

func (sl *SelectList) GetCollection() CollectionableGroup {
	return &SelectListCollection{}
}

func (sl *SelectList) GetCollectionName() string {
	return SELECTLIST_COLLECTION_NAME
}

func (sl *SelectList) GetBundleFolderName() string {
	return SELECTLIST_FOLDER_NAME
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
