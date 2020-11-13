package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/reqs"
	"gopkg.in/yaml.v3"
)

// ViewCollection slice
type ViewCollection []View

// GetName function
func (vc *ViewCollection) GetName() string {
	return "views"
}

// GetFields function
func (vc *ViewCollection) GetFields() []string {
	return []string{"id", "name", "definition", "dependencies", "workspaceid"}
}

// NewItem function
func (vc *ViewCollection) NewItem(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid View Key: " + key)
	}
	return &View{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	}, nil
}

// GetKeyPrefix function
func (vc *ViewCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (vc *ViewCollection) AddItem(item BundleableItem) {
	actual := *vc
	view := item.(*View)
	actual = append(actual, *view)
	*vc = actual
}

// GetItem function
func (vc *ViewCollection) GetItem(index int) CollectionableItem {
	actual := *vc
	return &actual[index]
}

// Loop function
func (vc *ViewCollection) Loop(iter func(item CollectionableItem) error) error {
	for _, item := range *vc {
		err := iter(&item)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (vc *ViewCollection) Len() int {
	return len(*vc)
}

func getYamlWithDefault(dataItem map[string]interface{}, key string, defaultItem map[string]interface{}) (*yaml.Node, error) {
	yamlNode := yaml.Node{}
	data, ok := dataItem[key]
	if !ok {
		err := yamlNode.Encode(&defaultItem)
		if err != nil {
			return nil, err
		}
	} else {
		var stuph map[string]interface{}
		err := yaml.Unmarshal([]byte(data.(string)), &stuph)
		if err != nil {
			return nil, err
		}

		err = yamlNode.Encode(&stuph)
		if err != nil {
			return nil, err
		}
	}

	return &yamlNode, nil
}

// UnMarshal function
func (vc *ViewCollection) UnMarshal(data []map[string]interface{}) error {
	err := StandardDecoder(vc, data)
	if err != nil {
		return err
	}
	for index := range *vc {
		dataItem := data[index]
		defNode, err := getYamlWithDefault(dataItem, "uesio.definition", map[string]interface{}{
			"wires":      map[string]interface{}{},
			"components": []map[string]interface{}{},
		})
		if err != nil {
			return err
		}
		depNode, err := getYamlWithDefault(dataItem, "uesio.dependencies", map[string]interface{}{
			"componentpacks": map[string]interface{}{
				"material.main": nil,
				"sample.main":   nil,
			},
		})
		if err != nil {
			return err
		}
		vcActual := *vc
		vcActual[index].Definition = *defNode
		vcActual[index].Dependencies = *depNode

	}
	return nil
}

// Marshal function
func (vc *ViewCollection) Marshal() ([]map[string]interface{}, error) {
	data, err := StandardEncoder(vc)
	if err != nil {
		return nil, err
	}
	vcActual := *vc
	for index := range data {
		def, err := yaml.Marshal(&vcActual[index].Definition)
		if err != nil {
			return nil, err
		}
		data[index]["uesio.definition"] = string(def)
	}

	return data, nil
}
