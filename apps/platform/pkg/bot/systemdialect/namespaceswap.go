package systemdialect

import (
	"encoding/json"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type NamespaceSwapItem struct {
	collection *NamespaceSwapCollection
	item       *adapt.Item
}

func (i *NamespaceSwapItem) MarshalJSON() ([]byte, error) {
	result := map[string]json.RawMessage{}
	err := i.Loop(func(fieldName string, value interface{}) error {
		fieldBytes, err := json.Marshal(value)
		if err != nil {
			return err
		}
		result[i.collection.SwapNSBack(fieldName)] = fieldBytes
		return nil
	})
	if err != nil {
		return nil, err
	}
	return json.Marshal(result)
}

func (i *NamespaceSwapItem) SetField(fieldName string, value interface{}) error {
	return i.item.SetField(fieldName, value)
}

func (i *NamespaceSwapItem) GetField(fieldName string) (interface{}, error) {
	return i.item.GetField(fieldName)
}

func (i *NamespaceSwapItem) GetFieldAsString(fieldName string) (string, error) {
	return i.item.GetFieldAsString(fieldName)
}

func (i *NamespaceSwapItem) Loop(iter func(string, interface{}) error) error {
	return i.item.Loop(iter)
}

func (i *NamespaceSwapItem) Len() int {
	return i.item.Len()
}

func NewNamespaceSwapCollection(from, to string) *NamespaceSwapCollection {
	return &NamespaceSwapCollection{
		from:       from,
		to:         to,
		collection: []*NamespaceSwapItem{},
	}
}

type NamespaceSwapCollection struct {
	from       string
	to         string
	collection []*NamespaceSwapItem
}

func (c *NamespaceSwapCollection) MarshalJSON() ([]byte, error) {
	return json.Marshal(c.collection)
}

func (c *NamespaceSwapCollection) NewItem() meta.Item {
	return &NamespaceSwapItem{
		collection: c,
		item:       &adapt.Item{},
	}
}

func (c *NamespaceSwapCollection) AddItem(item meta.Item) error {
	c.collection = append(c.collection, item.(*NamespaceSwapItem))
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
	return meta.SwapKeyNamespace(value, c.from, c.to)
}

func (c *NamespaceSwapCollection) SwapNSBack(value string) string {
	return meta.SwapKeyNamespace(value, c.to, c.from)
}

// Gets the conditions from the wire and translates them from core to studio
func (c *NamespaceSwapCollection) MapConditions(coreConditions []adapt.LoadRequestCondition) []adapt.LoadRequestCondition {
	var studioConditions []adapt.LoadRequestCondition
	for _, elem := range coreConditions {
		elem.Field = c.SwapNS(elem.Field)
		studioConditions = append(studioConditions, elem)
	}
	return studioConditions
}

func (c *NamespaceSwapCollection) MapOrder(coreOrder []adapt.LoadRequestOrder) []adapt.LoadRequestOrder {
	var studioOrder []adapt.LoadRequestOrder
	for _, elem := range coreOrder {
		elem.Field = c.SwapNS(elem.Field)
		studioOrder = append(studioOrder, elem)
	}
	return studioOrder
}

func (c *NamespaceSwapCollection) TransferFieldMetadata(fromCollectionName string, from, to *adapt.MetadataCache) error {

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
		clonedField.Namespace = c.from
		// Check to see if the field already exists
		_, err := toCollectionMetadata.GetField(clonedField.GetFullName())
		if err != nil {
			toCollectionMetadata.SetField(&clonedField)
		}
	}

	return nil
}
