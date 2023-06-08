package meta

import (
	"errors"
	"fmt"

	"github.com/francoispqt/gojay"
	yptr "github.com/zachelrath/yaml-jsonpointer"
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
	Category       string    `yaml:"category,omitempty" json:"uesio/studio.category"`
	Pack           string    `yaml:"pack,omitempty" json:"uesio/studio.pack"`
	EntryPoint     string    `yaml:"entrypoint,omitempty" json:"uesio/studio.entrypoint"`
	ConfigValues   []string  `yaml:"configvalues,omitempty" json:"uesio/studio.configvalues"`
	Variants       []string  `yaml:"variants,omitempty" json:"uesio/studio.variants"`
	Utilities      []string  `yaml:"utilities,omitempty" json:"uesio/studio.utilities"`
	Slots          yaml.Node `yaml:"slots,omitempty" json:"uesio/studio.slots"`

	// Builder Properties
	Title             string    `yaml:"title,omitempty" json:"uesio/studio.title"`
	Icon              string    `yaml:"icon,omitempty" json:"uesio/studio.icon"`
	Discoverable      bool      `yaml:"discoverable,omitempty" json:"uesio/studio.discoverable"`
	Description       string    `yaml:"description,omitempty" json:"uesio/studio.description"`
	Properties        yaml.Node `yaml:"properties,omitempty" json:"uesio/studio.properties"`
	DefaultDefinition yaml.Node `yaml:"defaultDefinition,omitempty" json:"uesio/studio.defaultdefinition"`
	Sections          yaml.Node `yaml:"sections,omitempty" json:"uesio/studio.sections"`
	Signals           yaml.Node `yaml:"signals,omitempty" json:"uesio/studio.signals"`

	// Internal only
	slotPaths      []string
	defaultVariant string
}

var no_default_variant = "--no-default--"

type SlotDefinition struct {
	Name string `yaml:"name"`
	Path string `yaml:"path,omitempty"`
}

type ComponentWrapper Component

type SlotDef struct {
	Name string
	Path string
}

// GetSlotPaths returns a slice of JSONPointers for extracting component slots within an instance of this component
func (c *Component) GetSlotPaths() []string {
	if c.slotPaths == nil {
		parsedSlots := make([]SlotDefinition, 0)
		// Decode the slots into the parsedSlots
		err := c.Slots.Decode(&parsedSlots)
		if err != nil {
			parsedSlots = []SlotDefinition{}
		}
		c.slotPaths = make([]string, len(parsedSlots))

		// If the component has slots, we need to traverse the slots to find other components
		// that need to be added to our dependencies
		for i, parsedSlot := range parsedSlots {
			c.slotPaths[i] = fmt.Sprintf("%s/%s", parsedSlot.Path, parsedSlot.Name)

		}
	}
	return c.slotPaths
}

// Returns the default variant for a Component by inspecting the default definition
// and looking for the "uesio.variant" key
func (c *Component) GetDefaultVariant() string {

	// If we've already looked for a default variant, but there isn't one defined, return empty
	if c.defaultVariant == no_default_variant {
		return ""
	}
	if c.defaultVariant == "" {
		if c.DefaultDefinition.Content != nil && len(c.DefaultDefinition.Content) >= 2 {
			val, err := yptr.Find(&c.DefaultDefinition, "/uesio.variant")
			if val != nil && err == nil && val.Value != "" {
				// Check if it is a string
				c.defaultVariant = val.Value
				return c.defaultVariant
			}
		}
		c.defaultVariant = no_default_variant
		return ""
	}
	return c.defaultVariant
}

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
	if c.Icon != "" {
		enc.AddStringKey("icon", c.Icon)
	}
	if c.Slots.Content != nil {
		enc.AddArrayKey("slots", (*YAMLDefinition)(&c.Slots))
	}
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
