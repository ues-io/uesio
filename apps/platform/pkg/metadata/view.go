package metadata

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"gopkg.in/yaml.v3"
)

// View struct
type View struct {
	ID         string    `yaml:"-" uesio:"uesio.id"`
	Name       string    `yaml:"name" uesio:"uesio.name"`
	Namespace  string    `yaml:"-" uesio:"-"`
	Definition yaml.Node `yaml:"definition" uesio:"uesio.definition"`
	Workspace  string    `yaml:"-" uesio:"uesio.workspaceid"`
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
func (v *View) GetConditions() ([]adapters.LoadRequestCondition, error) {
	return []adapters.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: v.Name,
		},
	}, nil
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
	if fieldName == "uesio.definition" {
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
	if fieldName == "uesio.definition" {
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

func getComponentsUsed(node *yaml.Node) map[string]bool {

	usedComps := map[string]bool{}
	if node.Kind != yaml.SequenceNode {
		return nil
	}

	for i := range node.Content {
		comp := node.Content[i]
		if isComponentLike(comp) {
			compName := comp.Content[0].Value
			usedComps[compName] = true
			for i := range comp.Content[1].Content {
				prop := comp.Content[1].Content[i]
				subComps := getComponentsUsed(prop)
				for i := range subComps {
					usedComps[i] = true
				}
			}
		}
	}

	return usedComps
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
	if node.Content[1].Kind != yaml.MappingNode {
		return false
	}
	return true
}

func (v *View) GetComponents() (map[string]bool, error) {

	components, err := getMapNode(&v.Definition, "components")
	if err != nil {
		return nil, err
	}

	return getComponentsUsed(components), nil
}
