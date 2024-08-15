package systemdialect

import (
	"encoding/json"
	"reflect"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/reflecttool"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func NewNamespaceSwapCollection(original, modified string) *NamespaceSwapCollection {
	return &NamespaceSwapCollection{
		original:   original,
		modified:   modified,
		collection: wire.Collection{},
	}
}

type NamespaceSwapCollection struct {
	original   string
	modified   string
	collection wire.Collection
}

func (c *NamespaceSwapCollection) MarshalJSON() ([]byte, error) {
	return json.Marshal(c.collection)
}

func (c *NamespaceSwapCollection) NewItem() meta.Item {
	return &wire.Item{}
}

func (c *NamespaceSwapCollection) SwapItem(item meta.Item) (*wire.Item, error) {
	swappedItem := &wire.Item{}
	err := item.Loop(func(s string, i interface{}) error {
		reflectValue := reflecttool.ReflectValue(i)
		kind := reflectValue.Kind()
		if kind == reflect.Struct {
			result := &wire.Item{}

			jsonBytes, err := json.Marshal(i)
			if err != nil {
				return err
			}

			err = json.Unmarshal(jsonBytes, result)
			if err != nil {
				return err
			}
			i = result
		}
		subItem, ok := i.(meta.Item)
		if ok {
			newItem, err := c.SwapItem(subItem)
			if err != nil {
				return err
			}
			i = newItem
		}
		return swappedItem.SetField(c.SwapNSBack(s), i)
	})
	if err != nil {
		return nil, err
	}
	return swappedItem, nil
}

func (c *NamespaceSwapCollection) AddItem(item meta.Item) error {
	// Loop over the item an convert the fields
	swappedItem, err := c.SwapItem(item)
	if err != nil {
		return err
	}
	c.collection = append(c.collection, swappedItem)
	return nil
}

func (c *NamespaceSwapCollection) Loop(iter meta.GroupIterator) error {
	for index := range c.collection {
		err := iter((c.collection)[index], strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (c *NamespaceSwapCollection) Len() int {
	return len(c.collection)
}

func (c *NamespaceSwapCollection) SwapNS(value string) string {
	return meta.SwapKeyNamespace(value, c.original, c.modified)
}

func (c *NamespaceSwapCollection) SwapNSBack(value string) string {
	return meta.SwapKeyNamespace(value, c.modified, c.original)
}

// MapConditions Gets the conditions from the wire and translates them from core to studio
func (c *NamespaceSwapCollection) MapConditions(coreConditions []wire.LoadRequestCondition) []wire.LoadRequestCondition {
	var studioConditions []wire.LoadRequestCondition
	for _, elem := range coreConditions {
		elem.Field = c.SwapNS(elem.Field)
		studioConditions = append(studioConditions, elem)
	}
	return studioConditions
}

func (c *NamespaceSwapCollection) MapOrder(coreOrder []wire.LoadRequestOrder) []wire.LoadRequestOrder {
	var studioOrder []wire.LoadRequestOrder
	for _, elem := range coreOrder {
		elem.Field = c.SwapNS(elem.Field)
		studioOrder = append(studioOrder, elem)
	}
	return studioOrder
}

func (c *NamespaceSwapCollection) TransferFieldMetadata(fromCollectionName string, from, to *wire.MetadataCache) error {

	fromCollectionMetadata, err := from.GetCollection(fromCollectionName)
	if err != nil {
		return err
	}

	toCollectionMetadata, err := to.GetCollection(c.SwapNSBack(fromCollectionName))
	if err != nil {
		return err
	}

	for _, field := range fromCollectionMetadata.Fields {
		clonedField := *field
		clonedField.Namespace = c.original
		// Make and select and reference fields TEXT
		// This is because they could use metadata items
		// this new namespace does not have access to.
		if wire.IsReference(clonedField.Type) || clonedField.Type == "SELECT" || clonedField.Type == "MULTISELECT" {
			clonedField.Type = "TEXT"
		}
		clonedField.Createable = false
		clonedField.Updateable = false
		// Check to see if the field already exists
		_, err := toCollectionMetadata.GetField(clonedField.GetFullName())
		if err != nil {
			toCollectionMetadata.SetField(&clonedField)
		}
	}

	return nil
}
