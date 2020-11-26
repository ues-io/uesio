package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// SelectListCollection slice
type SelectListCollection []SelectList

// GetName function
func (slc *SelectListCollection) GetName() string {
	return "selectlists"
}

// GetFields function
func (slc *SelectListCollection) GetFields() []string {
	return []string{"id", "name", "options"}
}

// NewItem function
func (slc *SelectListCollection) NewItem(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid SelectList Key: " + key)
	}
	return &SelectList{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	}, nil
}

// GetKeyPrefix function
func (slc *SelectListCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (slc *SelectListCollection) AddItem(item CollectionableItem) {
	*slc = append(*slc, *item.(*SelectList))
}

// GetItem function
func (slc *SelectListCollection) GetItem(index int) CollectionableItem {
	actual := *slc
	return &actual[index]
}

// Loop function
func (slc *SelectListCollection) Loop(iter func(item CollectionableItem) error) error {
	for index := range *slc {
		err := iter(slc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (slc *SelectListCollection) Len() int {
	return len(*slc)
}

// UnMarshal function
func (slc *SelectListCollection) UnMarshal(data []map[string]interface{}) error {
	err := StandardDecoder(slc, data)
	if err != nil {
		return err
	}
	for index := range *slc {
		dataItem := data[index]
		options := dataItem["uesio.options"].([]interface{})
		unMarshalledOptions := []SelectListOption{}

		for _, item := range options {
			option := item.(map[string]interface{})
			unMarshalledOptions = append(unMarshalledOptions, SelectListOption{
				Label: option["label"].(string),
				Value: option["value"].(string),
			})
		}

		slcActual := *slc
		slcActual[index].Options = unMarshalledOptions
	}
	return nil
}

// Marshal function
func (slc *SelectListCollection) Marshal() ([]map[string]interface{}, error) {
	data, err := StandardEncoder(slc)
	if err != nil {
		return nil, err
	}

	slcActual := *slc
	for index := range data {
		options := slcActual[index].Options
		marshalledOptions := []map[string]string{}

		for _, option := range options {
			marshalledOptions = append(marshalledOptions, map[string]string{
				"value": option.Value,
				"label": option.Label,
			})
		}

		data[index]["uesio.options"] = marshalledOptions
	}

	return data, nil
}
