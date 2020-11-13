package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// ComponentPackCollection slice
type ComponentPackCollection []ComponentPack

// GetName function
func (cpc *ComponentPackCollection) GetName() string {
	return "componentpacks"
}

// GetFields function
func (cpc *ComponentPackCollection) GetFields() []string {
	return []string{"id", "name", "workspaceid"}
}

// NewItem function
func (cpc *ComponentPackCollection) NewItem(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid ComponentPack Key: " + key)
	}
	return &ComponentPack{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	}, nil
}

// GetKeyPrefix function
func (cpc *ComponentPackCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (cpc *ComponentPackCollection) AddItem(item BundleableItem) {
	actual := *cpc
	componentPack := item.(*ComponentPack)
	actual = append(actual, *componentPack)
	*cpc = actual
}

// UnMarshal function
func (cpc *ComponentPackCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(cpc, data)
}

// Marshal function
func (cpc *ComponentPackCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(cpc)
}

// GetItem function
func (cpc *ComponentPackCollection) GetItem(index int) CollectionableItem {
	actual := *cpc
	return &actual[index]
}

// Loop function
func (cpc *ComponentPackCollection) Loop(iter func(item CollectionableItem) error) error {
	for _, item := range *cpc {
		err := iter(&item)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (cpc *ComponentPackCollection) Len() int {
	return len(*cpc)
}
