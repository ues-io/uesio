package meta

import (
	"encoding/json"
	"fmt"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

const (
	ReactComponent       = "REACT"
	DeclarativeComponent = "DECLARATIVE"
)

func NewComponent(key string) (*Component, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, fmt.Errorf("bad key for component: %s", key)
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
	Variants       []string `yaml:"variants,omitempty" json:"uesio/studio.variants"`
	Utilities      []string `yaml:"utilities,omitempty" json:"uesio/studio.utilities"`
	SubComponents  []string `yaml:"components,omitempty" json:"uesio/studio.components"`
	Slots          *YAMLDef `yaml:"slots,omitempty" json:"uesio/studio.slots"`
	Properties     *YAMLDef `yaml:"properties,omitempty" json:"uesio/studio.properties"`
	// Definition defines the Component body, for Declarative components
	Definition     *YAMLDef `yaml:"definition,omitempty" json:"uesio/studio.definition"`
	DefaultVariant string   `yaml:"defaultVariant,omitempty" json:"uesio/studio.defaultvariant"`

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
}

type SlotDefinition struct {
	Name            string   `yaml:"name"`
	Path            string   `yaml:"path,omitempty"`
	DefaultContent  *YAMLDef `yaml:"defaultContent,omitempty"`
	Label           string   `yaml:"label,omitempty"`
	Direction       string   `yaml:"direction,omitempty"`
	OnSelectSignals *YAMLDef `yaml:"onSelectSignals,omitempty"`
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
		c.slotDefs = ParseSlotDef((*yaml.Node)(c.Slots))
	}
	return c.slotDefs
}

func ParseSlotDef(slotDef *yaml.Node) []*SlotDefinition {
	if slotDef == nil {
		return []*SlotDefinition{}
	}
	parsedSlots := make([]*SlotDefinition, 0)
	// Decode the slots into the parsedSlots
	err := slotDef.Decode(&parsedSlots)
	if err != nil {
		return []*SlotDefinition{}
	}
	return parsedSlots
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

func (c *Component) GetDefaultVariant() string {
	return c.DefaultVariant
}

func (c *Component) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(c)
}

func (c *Component) MarshalJSONObject(enc *gojay.Encoder) {
	marshalJSONObjectCommon(c, enc)
	enc.AddStringKey("title", c.Title)
	enc.AddStringKey("description", c.Description)
	enc.AddStringKey("category", c.Category)
	enc.AddBoolKey("discoverable", c.Discoverable)
	enc.AddStringKeyOmitEmpty("icon", c.Icon)
	enc.AddArrayKeyOmitEmpty("properties", (*YAMLtoJSONArray)(c.Properties))
	enc.AddArrayKeyOmitEmpty("sections", (*YAMLtoJSONArray)(c.Sections))
	enc.AddObjectKeyOmitEmpty("defaultDefinition", (*YAMLtoJSONMap)(c.DefaultDefinition))
	enc.AddObjectKeyOmitEmpty("signals", (*YAMLtoJSONMap)(c.Signals))
	enc.AddObjectKeyOmitEmpty("styleRegions", (*YAMLtoJSONMap)(c.StyleRegions))
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

func (c *Component) SetField(fieldName string, value any) error {
	return StandardFieldSet(c, fieldName, value)
}

func (c *Component) GetField(fieldName string) (any, error) {
	return StandardFieldGet(c, fieldName)
}

func (c *Component) Loop(iter func(string, any) error) error {
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
	marshalJSONObjectCommon((*Component)(cdw), enc)
	// This is a hassle, but to avoid sending down a LOT of property metadata which the runtime doesn't need,
	// we decode into a custom struct and then serialize just that.
	if cdw.Properties != nil {
		props := PropertyDefs{}
		err := cdw.Properties.Decode(&props)
		// Only send down properties if we have a default value for one of them
		if err == nil {
			havePropWithDefault := false
			for _, prop := range props {
				if prop.DefaultValue != nil {
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
	Name         string `yaml:"name" json:"name"`
	DefaultValue any    `yaml:"defaultValue" json:"defaultValue"`
	Type         string `yaml:"type" json:"type"`
}

type PropertyDefs []*PropertyDef

func (props *PropertyDefs) IsNil() bool {
	return props == nil || len(*props) == 0
}

func (props *PropertyDefs) MarshalJSONArray(enc *gojay.Encoder) {
	if props != nil {
		for _, prop := range *props {
			// Only serialize props with default values, since that's all we need them for (runtime)
			if prop.DefaultValue != nil {
				// use default marshaller and just write it, so that we don't have to go through Gojay
				// serialization nonsense
				if rawJson, err := json.Marshal(prop); err == nil {
					embeddedJSON := (gojay.EmbeddedJSON)(rawJson)
					enc.AddEmbeddedJSON(&embeddedJSON)
				}
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

func marshalJSONObjectCommon(c *Component, enc *gojay.Encoder) {
	enc.AddStringKey("namespace", c.Namespace)
	enc.AddStringKey("name", c.Name)
	enc.AddStringKey("type", c.GetType())
	enc.AddStringKeyOmitEmpty("defaultVariant", c.DefaultVariant)
	enc.AddArrayKeyOmitEmpty("slots", (*YAMLtoJSONArray)(c.Slots))
	enc.AddArrayKeyOmitEmpty("definition", (*YAMLtoJSONArray)(c.Definition))
}
