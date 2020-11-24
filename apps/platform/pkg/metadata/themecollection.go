package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/reqs"
	"gopkg.in/yaml.v3"
)

// ThemeCollection slice
type ThemeCollection []Theme

// GetName function
func (tc *ThemeCollection) GetName() string {
	return "themes"
}

// GetFields function
func (tc *ThemeCollection) GetFields() []string {
	return []string{"id", "name", "definition", "workspaceid"}
}

// NewItem function
func (tc *ThemeCollection) NewItem(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid Theme Key: " + key)
	}
	return &Theme{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	}, nil
}

// GetKeyPrefix function
func (tc *ThemeCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (tc *ThemeCollection) AddItem(item CollectionableItem) {
	*tc = append(*tc, *item.(*Theme))
}

// GetItem function
func (tc *ThemeCollection) GetItem(index int) CollectionableItem {
	actual := *tc
	return &actual[index]
}

// Loop function
func (tc *ThemeCollection) Loop(iter func(item CollectionableItem) error) error {
	for index := range *tc {
		err := iter(tc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (tc *ThemeCollection) Len() int {
	return len(*tc)
}

// UnMarshal function
func (tc *ThemeCollection) UnMarshal(data []map[string]interface{}) error {
	err := StandardDecoder(tc, data)
	if err != nil {
		return err
	}
	for index := range *tc {
		dataItem := data[index]
		defNode, err := getYamlWithDefault(dataItem, "uesio.definition", map[string]interface{}{})
		if err != nil {
			return err
		}

		tcActual := *tc
		tcActual[index].Definition = *defNode

	}
	return nil
}

// Marshal function
func (tc *ThemeCollection) Marshal() ([]map[string]interface{}, error) {
	data, err := StandardEncoder(tc)
	if err != nil {
		return nil, err
	}
	tcActual := *tc
	for index := range data {
		def, err := yaml.Marshal(&tcActual[index].Definition)
		if err != nil {
			return nil, err
		}
		data[index]["uesio.definition"] = string(def)
	}

	return data, nil
}
