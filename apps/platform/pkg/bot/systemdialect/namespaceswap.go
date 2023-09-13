package systemdialect

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type NamespaceSwapItem adapt.Item

func swapNS(value, from, to string) string {
	return meta.GetFullyQualifiedKey(meta.GetLocalizedKey(value, from), to)
}

func (i *NamespaceSwapItem) SetField(fieldName string, value interface{}) error {
	return (*adapt.Item)(i).SetField(swapNS(fieldName, "uesio/studio", "uesio/core"), value)
}

func (i *NamespaceSwapItem) GetField(fieldName string) (interface{}, error) {
	return (*adapt.Item)(i).GetField(swapNS(fieldName, "uesio/studio", "uesio/core"))
}

func (i *NamespaceSwapItem) GetFieldAsString(fieldName string) (string, error) {
	return (*adapt.Item)(i).GetFieldAsString(swapNS(fieldName, "uesio/studio", "uesio/core"))
}

func (i *NamespaceSwapItem) Loop(iter func(string, interface{}) error) error {
	return (*adapt.Item)(i).Loop(iter)
}

func (i *NamespaceSwapItem) Len() int {
	return (*adapt.Item)(i).Len()
}

type NamespaceSwapCollection []*NamespaceSwapItem

func (c *NamespaceSwapCollection) NewItem() meta.Item {
	return &NamespaceSwapItem{}
}

func (c *NamespaceSwapCollection) AddItem(item meta.Item) error {
	*c = append(*c, item.(*NamespaceSwapItem))
	return nil
}

func (c *NamespaceSwapCollection) Loop(iter meta.GroupIterator) error {
	for index := range *c {
		err := iter((*c)[index], strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (c *NamespaceSwapCollection) Len() int {
	return len(*c)
}

// Gets the conditions from the wire and translates them from core to studio
func mapConditions(coreConditions []adapt.LoadRequestCondition) []adapt.LoadRequestCondition {
	var studioConditions []adapt.LoadRequestCondition
	for _, elem := range coreConditions {
		elem.Field = meta.GetLocalizedKey(elem.Field, "uesio/core")
		studioConditions = append(studioConditions, elem)
	}
	return studioConditions
}

func mapOrder(coreOrder []adapt.LoadRequestOrder) []adapt.LoadRequestOrder {
	var studioOrder []adapt.LoadRequestOrder
	for _, elem := range coreOrder {
		elem.Field = meta.GetLocalizedKey(elem.Field, "uesio/core")
		studioOrder = append(studioOrder, elem)
	}
	return studioOrder
}
