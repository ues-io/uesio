package meta

import (
	"errors"
	"fmt"

	"github.com/francoispqt/gojay"
	yptr "github.com/zachelrath/yaml-jsonpointer"
	"gopkg.in/yaml.v3"
)

const (
	ReactComponent       = "REACT"
	DeclarativeComponent = "DECLARATIVE"
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
	Category       string   `yaml:"category,omitempty" json:"uesio/studio.category"`
	Pack           string   `yaml:"pack,omitempty" json:"uesio/studio.pack"`
	EntryPoint     string   `yaml:"entrypoint,omitempty" json:"uesio/studio.entrypoint"`
	Type           string   `yaml:"type,omitempty" json:"uesio/studio.type"`
	ConfigValues   []string `yaml:"configvalues,omitempty" json:"uesio/studio.configvalues"`
	Variants       []string `yaml:"variants,omitempty" json:"uesio/studio.variants"`
	Utilities      []string `yaml:"utilities,omitempty" json:"uesio/studio.utilities"`
	Slots          *YAMLDef `yaml:"slots,omitempty" json:"uesio/studio.slots"`
	Properties     *YAMLDef `yaml:"properties,omitempty" json:"uesio/studio.properties"`
	// Definition defines the Component body, for Declarative components
	Definition *YAMLDef `yaml:"definition,omitempty" json:"uesio/studio.definition"`

	// Builder-only Properties
	Title             string   `yaml:"title,omitempty" json:"uesio/studio.title"`
	Icon              string   `yaml:"icon,omitempty" json:"uesio/studio.icon"`
	Discoverable      bool     `yaml:"discoverable,omitempty" json:"uesio/studio.discoverable"`
	Description       string   `yaml:"description,omitempty" json:"uesio/studio.description"`
	DefaultDefinition *YAMLDef `yaml:"defaultDefinition,omitempty" json:"uesio/studio.defaultdefinition"`
	Sections          *YAMLDef `yaml:"sections,omitempty" json:"uesio/studio.sections"`
	Signals           *YAMLDef `yaml:"signals,omitempty" json:"uesio/studio.signals"`
	StyleRegions      *YAMLDef `yaml:"styleRegions,omitempty" json:"uesio/studio.styleregions"`

	// Internal only
	slotDefs             []*SlotDefinition
	variantPropertyNames map[string]*PropertyDefinition
	defaultVariant       string
}

var no_default_variant = "--no-default--"

type SlotDefinition struct {
	Name           string   `yaml:"name"`
	Path           string   `yaml:"path,omitempty"`
	DefaultContent *YAMLDef `yaml:"defaultContent,omitempty"`
	Label          string   `yaml:"label,omitempty"`
	Direction      string   `yaml:"direction,omitempty"`
}

// PropertyDefinition is used (currently) only during view dependency processing
// to extract variant dependencies from properties of type "METADATA"
// with metadata.type="COMPONENTVARIANT"
type PropertyDefinition struct {
	Name         string                 `yaml:"name"`
	Type         string                 `yaml:"type"`
	DefaultValue string                 `yaml:"defaultValue"`
	Metadata     *MetadataFieldMetadata `yaml:"metadata"`
}

// GetFullPath returns a JSONPointer for extracting a component slot within an instance of this component
func (sd *SlotDefinition) GetFullPath() string {
	return fmt.Sprintf("%s/%s", sd.Path, sd.Name)
}

type ComponentWrapper Component

// GetSlotDefinitions returns a slice of parsed slot definitions to use for dependency processing
func (c *Component) GetSlotDefinitions() []*SlotDefinition {
	if c.slotDefs == nil && c.Slots != nil {
		parsedSlots := make([]*SlotDefinition, 0)
		// Decode the slots into the parsedSlots
		err := c.Slots.Decode(&parsedSlots)
		if err != nil {
			parsedSlots = []*SlotDefinition{}
		}
		c.slotDefs = parsedSlots
	}
	return c.slotDefs
}

// GetVariantPropertyNames returns a map/set of component properties of type: METADATA
// with metadata.type = "COMPONENTVARIANT"
func (c *Component) GetVariantPropertyNames() map[string]*PropertyDefinition {
	if c.variantPropertyNames == nil && c.Properties != nil {
		parsedProps := make([]*PropertyDefinition, 0)
		// Decode the properties
		err := c.Properties.Decode(&parsedProps)
		if err != nil {
			parsedProps = []*PropertyDefinition{}
		}
		// Now extract out just the properties of type METADATA with subtype COMPONENTVARIANT
		c.variantPropertyNames = map[string]*PropertyDefinition{}
		for _, prop := range parsedProps {
			// TODO: Consider METADATA properties nested within "LIST" / "STRUCT" Properties.
			// For now just handling top-level
			if prop.Type == "METADATA" && prop.Metadata != nil && prop.Metadata.Type == "COMPONENTVARIANT" && prop.Metadata.Grouping != "" {
				c.variantPropertyNames[prop.Name] = prop
			}
		}
	}
	return c.variantPropertyNames
}

// GetDefaultVariant returns the default variant for a Component by inspecting the default definition
// and looking for the "uesio.variant" key
func (c *Component) GetDefaultVariant() string {

	// If we've already looked for a default variant, but there isn't one defined, return empty
	if c.defaultVariant == no_default_variant {
		return ""
	}
	if c.defaultVariant == "" {
		if c.DefaultDefinition != nil && c.DefaultDefinition.Content != nil && len(c.DefaultDefinition.Content) >= 2 {
			val, err := yptr.Find((*yaml.Node)(c.DefaultDefinition), "/uesio.variant")
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
	enc.AddStringKey("type", c.GetType())
	enc.AddStringKey("category", c.Category)
	enc.AddBoolKey("discoverable", c.Discoverable)
	enc.AddStringKeyOmitEmpty("icon", c.Icon)
	enc.AddArrayKeyOmitEmpty("slots", (*YAMLtoJSONArray)(c.Slots))
	enc.AddArrayKeyOmitEmpty("properties", (*YAMLtoJSONArray)(c.Properties))
	enc.AddArrayKeyOmitEmpty("sections", (*YAMLtoJSONArray)(c.Sections))
	enc.AddObjectKeyOmitEmpty("defaultDefinition", (*YAMLtoJSONMap)(c.DefaultDefinition))
	enc.AddObjectKeyOmitEmpty("signals", (*YAMLtoJSONMap)(c.Signals))
	enc.AddObjectKeyOmitEmpty("styleRegions", (*YAMLtoJSONMap)(c.StyleRegions))
	enc.AddArrayKeyOmitEmpty("definition", (*YAMLtoJSONArray)(c.Definition))
}

func (c *Component) IsNil() bool {
	return c == nil
}

func (c *Component) GetCollectionName() string {
	return COMPONENT_COLLECTION_NAME
}

func (c *Component) GetCollection() CollectionableGroup {
	return &ComponentCollection{}
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

func (c *Component) GetLabel() string {
	if c.Title != "" {
		return c.Title
	}
	if c.Label != "" {
		return c.Label
	}
	return c.Name
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

func (c *Component) GetType() string {
	return GetType(c.Type)
}

// RuntimeComponentMetadata allows us to send a trimmed-down runtime component metadata payload
// containing only those properties needed at runtime into the componentType Redux slice.
// In Build mode, the full Component metadata will be sent, to facilitate full Builder functionality.
type RuntimeComponentMetadata Component

func (cdw *RuntimeComponentMetadata) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(cdw)
}

func (cdw *RuntimeComponentMetadata) IsNil() bool {
	return cdw == nil
}

func (cdw *RuntimeComponentMetadata) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("namespace", cdw.Namespace)
	enc.AddStringKey("name", cdw.Name)
	enc.AddStringKey("type", cdw.GetType())
	enc.AddArrayKeyOmitEmpty("definition", (*YAMLtoJSONArray)(cdw.Definition))
	enc.AddArrayKeyOmitEmpty("slots", (*YAMLtoJSONArray)(cdw.Slots))
	// This is a hassle, but to avoid sending down a LOT of property metadata which the runtime doesn't need,
	// we decode into a custom struct and then serialize just that.
	if cdw.Properties != nil {
		props := PropertyDefs{}
		err := cdw.Properties.Decode(&props)
		// Only send down properties if we have a default value for one of them
		if err == nil {
			havePropWithDefault := false
			for _, prop := range props {
				if prop.DefaultValue != "" {
					havePropWithDefault = true
					break
				}
			}
			if havePropWithDefault {
				enc.AddArrayKeyOmitEmpty("properties", &props)
			}
		}
	}
}

func (cdw *RuntimeComponentMetadata) GetType() string {
	return GetType(cdw.Type)
}

type PropertyDef struct {
	Name         string `yaml:"name"`
	DefaultValue string `yaml:"defaultValue,omitempty"`
}

func (p *PropertyDef) IsNil() bool {
	return p == nil
}

func (p *PropertyDef) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("name", p.Name)
	enc.AddStringKeyOmitEmpty("defaultValue", p.DefaultValue)
}

type PropertyDefs []*PropertyDef

func (props *PropertyDefs) IsNil() bool {
	return props == nil || len(*props) == 0
}

func (props *PropertyDefs) MarshalJSONArray(enc *gojay.Encoder) {
	if props != nil {
		for _, prop := range *props {
			// Only serialize props with default values, since that's all we need them for (runtime)
			if prop.DefaultValue != "" {
				enc.AddObject(prop)
			}
		}
	}
}

func GetType(componentType string) string {
	if componentType != "" {
		return componentType
	}
	return ReactComponent
}
