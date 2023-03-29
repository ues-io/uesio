package meta

import (
	"errors"
	"strings"

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
	Category       string    `yaml:"category,omitempty" json:"uesio/studio.category"`
	Pack           string    `yaml:"pack,omitempty" json:"uesio/studio.pack"`
	EntryPoint     string    `yaml:"entrypoint,omitempty" json:"uesio/studio.entrypoint"`
	ConfigValues   []string  `yaml:"configvalues,omitempty" json:"uesio/studio.configvalues"`
	Variants       []string  `yaml:"variants,omitempty" json:"uesio/studio.variants"`
	Utilities      []string  `yaml:"utilities,omitempty" json:"uesio/studio.utilities"`
	Slots          yaml.Node `yaml:"slots,omitempty" json:"uesio/studio.slots"`

	// Builder Properties
	Title             string    `yaml:"title,omitempty" json:"uesio/studio.title"`
	Discoverable      bool      `yaml:"discoverable,omitempty" json:"uesio/studio.discoverable"`
	Description       string    `yaml:"description,omitempty" json:"uesio/studio.description"`
	Properties        yaml.Node `yaml:"properties" json:"uesio/studio.properties"`
	DefaultDefinition yaml.Node `yaml:"defaultDefinition" json:"uesio/studio.defaultdefinition"`
	Sections          yaml.Node `yaml:"sections" json:"uesio/studio.sections"`
	Signals           yaml.Node `yaml:"signals" json:"uesio/studio.signals"`

	// Internal only
	slotTraversalMap map[string]*SlotTraversalNode
}

type SlotDefinition struct {
	Name string `yaml:"name"`
	Path string `yaml:"path"`
}

type ComponentWrapper Component

type SlotNodeType int

const (
	PropertyNode SlotNodeType = iota
	ArrayNode    SlotNodeType = iota
	TerminalNode SlotNodeType = iota
)

type SlotTraversalNode struct {
	Name string
	Type SlotNodeType
	Next *SlotTraversalNode
}

type SlotDef struct {
	Name string
	Path string
}

func (c *Component) GetSlotTraversalMap() map[string]*SlotTraversalNode {
	if c.slotTraversalMap == nil {
		parsedSlots := make([]SlotDefinition, 0)
		// Decode the slots into the parsedSlots
		err := c.Slots.Decode(&parsedSlots)
		if err != nil {
			parsedSlots = []SlotDefinition{}
		}
		c.slotTraversalMap = map[string]*SlotTraversalNode{}

		// If the component has slots, we need to traverse the slots to find other components
		// that need to be added to our dependencies
		for _, parsedSlot := range parsedSlots {
			if parsedSlot.Path == "" {
				c.slotTraversalMap[parsedSlot.Name] = &SlotTraversalNode{
					Type: TerminalNode,
				}
			} else {
				var currentSlot *SlotTraversalNode
				// Parse the path as a YAML Path and add slot traversal nodes to the slots map
				for _, part := range strings.Split(parsedSlot.Path, ".") {
					// If the part contains a [*] then we need to parse it as an array.
					// Otherwise, it's a simple property, and we can just add it
					slotType := PropertyNode
					slotName := part
					if strings.Contains(part, "[*]") {
						part = strings.Replace(part, "[*]", "", -1)
						slotType = ArrayNode
						slotName = parsedSlot.Name
					}
					// If we are at the root, then use the part as the map key
					newSlot := &SlotTraversalNode{
						Name: slotName,
						Type: slotType,
					}
					if currentSlot == nil {
						currentSlot = newSlot
						c.slotTraversalMap[part] = currentSlot
					} else {
						// If we already have a current slot, then fill in current as the next node
						currentSlot.Next = newSlot
						currentSlot = newSlot
					}
				}

			}

		}
	}
	return c.slotTraversalMap
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
