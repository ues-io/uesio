package systemdialect

import (
	"encoding/json"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type NamespaceSwapItem struct {
	collection *NamespaceSwapCollection
	item       adapt.Item
}

func (i *NamespaceSwapItem) MarshalJSON() ([]byte, error) {
	return json.Marshal(i.item)
}

func swapNS(value, from, to string) string {
	return meta.GetFullyQualifiedKey(meta.GetLocalizedKey(value, from), to)
}

func (i *NamespaceSwapItem) SetField(fieldName string, value interface{}) error {
	return i.item.SetField(swapNS(fieldName, i.collection.from, i.collection.to), value)
}

func (i *NamespaceSwapItem) GetField(fieldName string) (interface{}, error) {
	return i.item.GetField(swapNS(fieldName, i.collection.from, i.collection.to))
}

func (i *NamespaceSwapItem) GetFieldAsString(fieldName string) (string, error) {
	return i.item.GetFieldAsString(swapNS(fieldName, i.collection.from, i.collection.to))
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
		item:       adapt.Item{},
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

// Gets the conditions from the wire and translates them from core to studio
func (c *NamespaceSwapCollection) MapConditions(coreConditions []adapt.LoadRequestCondition) []adapt.LoadRequestCondition {
	var studioConditions []adapt.LoadRequestCondition
	for _, elem := range coreConditions {
		elem.Field = meta.GetLocalizedKey(elem.Field, c.to)
		studioConditions = append(studioConditions, elem)
	}
	return studioConditions
}

func (c *NamespaceSwapCollection) MapOrder(coreOrder []adapt.LoadRequestOrder) []adapt.LoadRequestOrder {
	var studioOrder []adapt.LoadRequestOrder
	for _, elem := range coreOrder {
		elem.Field = meta.GetLocalizedKey(elem.Field, c.to)
		studioOrder = append(studioOrder, elem)
	}
	return studioOrder
}