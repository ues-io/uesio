package meta

import (
	"fmt"
	"strings"

	"gopkg.in/yaml.v3"
)

// View struct
type View struct {
	ID         string    `yaml:"-" uesio:"studio.id"`
	Name       string    `yaml:"name" uesio:"studio.name"`
	Namespace  string    `yaml:"-" uesio:"-"`
	Definition yaml.Node `yaml:"definition" uesio:"studio.definition"`
	Workspace  string    `yaml:"-" uesio:"studio.workspaceid"`
	itemMeta   *ItemMeta `yaml:"-" uesio:"-"`
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

// GetConditions function
func (v *View) GetConditions() map[string]string {
	return map[string]string{
		"studio.name": v.Name,
	}
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
	return v.GetKey() + ".yaml"
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
		v.Definition = *definition.Content[0]
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
	v.Workspace = workspace
}

// Loop function
func (v *View) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(v, iter)
}

// GetItemMeta function
func (v *View) GetItemMeta() *ItemMeta {
	return v.itemMeta
}

// SetItemMeta function
func (v *View) SetItemMeta(itemMeta *ItemMeta) {
	v.itemMeta = itemMeta
}

func getMapNode(node *yaml.Node, key string) (*yaml.Node, error) {
	if node.Kind != yaml.MappingNode {
		return nil, fmt.Errorf("Definition is not a mapping node.")
	}

	for i := range node.Content {
		if node.Content[i].Value == key {
			return node.Content[i+1], nil
		}
	}

	return nil, fmt.Errorf("Node not found of key: " + key)
}

func getComponentsAndVariantsUsed(node *yaml.Node, usedComps *map[string]bool, usedVariants *map[string]bool) {
	if node.Kind != yaml.SequenceNode {
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

	if panels != nil {
		getComponentsAndVariantsUsed(panels, &usedComps, &usedVariants)
	}

	return usedComps, usedVariants, nil
}
