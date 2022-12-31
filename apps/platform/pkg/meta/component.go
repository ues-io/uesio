package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

func NewComponent(key string) (*Component, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Component: " + key)
	}
	return NewBaseComponent(namespace, name), nil
}

func NewBaseComponent(namespace, name string) *Component {
	return &Component{BundleableBase: NewBase(namespace, name)}
}

type Component struct {
	Pack         string   `yaml:"pack,omitempty" json:"uesio/studio.pack"`
	EntryPoint   string   `yaml:"entrypoint,omitempty" json:"uesio/studio.entrypoint"`
	ConfigValues []string `yaml:"configvalues,omitempty" json:"uesio/studio.configvalues"`
	Variants     []string `yaml:"variants,omitempty" json:"uesio/studio.variants"`
	Utilities    []string `yaml:"utilities,omitempty" json:"uesio/studio.utilities"`
	BuiltIn
	BundleableBase `yaml:",inline"`
}

type ComponentWrapper Component

func (c *Component) GetCollectionName() string {
	return COMPONENT_COLLECTION_NAME
}

func (c *Component) GetBundleFolderName() string {
	return COMPONENT_FOLDER_NAME
}

func (c *Component) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(c, fieldName, value)
}

func (c *Component) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(c, fieldName)
}

func (c *Component) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}

func (c *Component) Len() int {
	return StandardItemLen(c)
}

func (c *Component) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, c.Name)
	if err != nil {
		return err
	}
	return node.Decode((*ComponentWrapper)(c))
}

func (c *Component) IsPublic() bool {
	return true
}
