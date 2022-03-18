package meta

import (
	"fmt"
	"strings"

	"github.com/humandad/yaml"
)

// View struct
type View struct {
	ID         string     `yaml:"-" uesio:"uesio/core.id"`
	Name       string     `yaml:"name" uesio:"uesio/studio.name"`
	Namespace  string     `yaml:"-" uesio:"-"`
	Definition yaml.Node  `yaml:"definition" uesio:"uesio/studio.definition"`
	Workspace  *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	itemMeta   *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy  *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner      *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy  *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt  int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt  int64      `yaml:"-" uesio:"uesio/core.createdat"`
}

// GetCollectionName function
func (v *View) GetCollectionName() string {
	return v.GetBundleGroup().GetName()
}

// GetCollection function
func (v *View) GetCollection() CollectionableGroup {
	var vc ViewCollection
	return &vc
}

func (v *View) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, v.Name)
}

// GetBundleGroup function
func (v *View) GetBundleGroup() BundleableGroup {
	var vc ViewCollection
	return &vc
}

// GetKey function
func (v *View) GetKey() string {
	return v.Namespace + "." + v.Name
}

// GetPath function
func (v *View) GetPath() string {
	return v.Name + ".yaml"
}

// GetPermChecker function
func (v *View) GetPermChecker() *PermissionSet {
	key := v.GetKey()
	return &PermissionSet{
		ViewRefs: map[string]bool{
			key: true,
		},
	}
}

// SetField function
func (v *View) SetField(fieldName string, value interface{}) error {
	if fieldName == "studio.definition" {
		var definition yaml.Node
		err := yaml.Unmarshal([]byte(value.(string)), &definition)
		if err != nil {
			return err
		}
		if len(definition.Content) > 0 {
			v.Definition = *definition.Content[0]
		}

		return nil
	}
	return StandardFieldSet(v, fieldName, value)
}

// GetField function
func (v *View) GetField(fieldName string) (interface{}, error) {
	if fieldName == "studio.definition" {
		bytes, err := yaml.Marshal(&v.Definition)
		if err != nil {
			return nil, err
		}
		return string(bytes), nil
	}
	return StandardFieldGet(v, fieldName)
}

// GetNamespace function
func (v *View) GetNamespace() string {
	return v.Namespace
}

// SetNamespace function
func (v *View) SetNamespace(namespace string) {
	v.Namespace = namespace
}

// SetWorkspace function
func (v *View) SetWorkspace(workspace string) {
	v.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (v *View) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(v, iter)
}

// Len function
func (v *View) Len() int {
	return StandardItemLen(v)
}

// GetItemMeta function
func (v *View) GetItemMeta() *ItemMeta {
	return v.itemMeta
}

// SetItemMeta function
func (v *View) SetItemMeta(itemMeta *ItemMeta) {
	v.itemMeta = itemMeta
}

func (v *View) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, v.Name)
	if err != nil {
		return err
	}
	return node.Decode(v)
}

func getComponentsAndVariantsUsed(node *yaml.Node, usedComps *map[string]bool, usedVariants *map[string]bool) {
	if node == nil || node.Kind != yaml.SequenceNode {
		return
	}

	for i := range node.Content {
		comp := node.Content[i]
		if isComponentLike(comp) {
			compName := comp.Content[0].Value
			(*usedComps)[compName] = true
			for i, prop := range comp.Content[1].Content {
				if prop.Kind == yaml.ScalarNode && prop.Value == "uesio.variant" {
					if len(comp.Content[1].Content) > i {
						valueNode := comp.Content[1].Content[i+1]
						if valueNode.Kind == yaml.ScalarNode && valueNode.Value != "" {
							(*usedVariants)[compName+"."+valueNode.Value] = true
						}
					}
				}
				getComponentsAndVariantsUsed(prop, usedComps, usedVariants)
			}
		}
	}
}

func isComponentLike(node *yaml.Node) bool {
	// It's a mappingNode
	if node.Kind != yaml.MappingNode {
		return false
	}
	if len(node.Content) != 2 {
		return false
	}
	name := node.Content[0].Value
	nameParts := strings.Split(name, ".")
	if len(nameParts) != 2 {
		return false
	}
	if node.Content[1].Kind != yaml.MappingNode && node.Content[1].Tag != "!!null" {
		return false
	}
	return true
}

func (v *View) GetComponentsAndVariants() (map[string]bool, map[string]bool, error) {

	components, err := getMapNode(&v.Definition, "components")
	if err != nil {
		return nil, nil, err
	}
	panels, err := getMapNode(&v.Definition, "panels")
	if err != nil {
		panels = nil
	}

	usedComps := map[string]bool{}
	usedVariants := map[string]bool{}

	getComponentsAndVariantsUsed(components, &usedComps, &usedVariants)

	if panels != nil && panels.Kind == yaml.MappingNode {
		for i := range panels.Content {
			if i%2 != 0 {
				panel := panels.Content[i]
				panelType, err := getMapNode(panel, "uesio.type")
				if err != nil {
					return nil, nil, err
				}
				if panelType.Kind == yaml.ScalarNode {
					usedComps[panelType.Value] = true
				}
				for i := range panel.Content {
					if i%2 != 0 {
						node := panel.Content[i]
						getComponentsAndVariantsUsed(node, &usedComps, &usedVariants)
					}
				}
			}
		}
	}

	return usedComps, usedVariants, nil
}
