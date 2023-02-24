package meta

import (
	"errors"

	"github.com/francoispqt/gojay"
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
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Title          string   `yaml:"title,omitempty" json:"uesio/studio.title"`
	Description    string   `yaml:"description,omitempty" json:"uesio/studio.description"`
	Category       string   `yaml:"category,omitempty" json:"uesio/studio.category"`
	Pack           string   `yaml:"pack,omitempty" json:"uesio/studio.pack"`
	EntryPoint     string   `yaml:"entrypoint,omitempty" json:"uesio/studio.entrypoint"`
	ConfigValues   []string `yaml:"configvalues,omitempty" json:"uesio/studio.configvalues"`
	Variants       []string `yaml:"variants,omitempty" json:"uesio/studio.variants"`
	Utilities      []string `yaml:"utilities,omitempty" json:"uesio/studio.utilities"`

	// Builder Properties
	Discoverable      bool      `yaml:"discoverable,omitempty" json:"uesio/studio.discoverable"`
	Properties        yaml.Node `yaml:"properties" json:"uesio/studio.properties"`
	DefaultDefinition yaml.Node `yaml:"defaultDefinition" json:"uesio/studio.defaultdefinition"`
	Sections          yaml.Node `yaml:"sections" json:"uesio/studio.sections"`
	Signals           yaml.Node `yaml:"signals" json:"uesio/studio.signals"`
}

type ComponentWrapper Component

func (c *Component) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(c)
}

func (c *Component) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("namespace", c.Namespace)
	enc.AddStringKey("name", c.Name)
	enc.AddStringKey("title", c.Title)
	enc.AddStringKey("description", c.Description)
	enc.AddStringKey("category", c.Category)
	enc.AddBoolKey("discoverable", c.Discoverable)
	if c.Properties.Content != nil {
		enc.AddArrayKey("properties", (*YAMLDefinition)(&c.Properties))
	}
	if c.Sections.Content != nil {
		enc.AddArrayKey("sections", (*YAMLDefinition)(&c.Sections))
	}
	if c.DefaultDefinition.Content != nil {
		enc.AddObjectKey("defaultDefinition", (*YAMLDefinition)(&c.DefaultDefinition))
	}
	if c.Signals.Content != nil {
		enc.AddObjectKey("signals", (*YAMLDefinition)(&c.Signals))
	}
}

func (c *Component) IsNil() bool {
	return c == nil
}

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
