package adapters

import (
	"encoding/json"
)

// Collection struct
type Collection struct {
	Data []Item `json:"data"`
}

// GetItem function
func (c *Collection) GetItem(index int) LoadableItem {
	return &c.Data[index]
}

// AddItem function
func (c *Collection) AddItem(item LoadableItem) {
	c.Data = append(c.Data, *item.(*Item))
}

// NewItem function
func (c *Collection) NewItem() LoadableItem {
	return &Item{}
}

// Sort function
func (c *Collection) Sort(order []LoadRequestOrder, collectionMetadata *CollectionMetadata) {

	//Generate order function dynamically

	var functions []lessFunc

	for _, singleOrder := range order {
		fieldMetadata, _ := collectionMetadata.GetField(singleOrder.Field)
		fieldID, _ := GetUIFieldName(fieldMetadata)

		functions = append(functions, func(c1, c2 *Item) bool {
			vi, _ := c1.GetField(fieldID)
			vj, _ := c2.GetField(fieldID)
			if singleOrder.Desc {
				return vi.(string) > vj.(string)
			}
			return vi.(string) < vj.(string)
		})
	}

	OrderedBy(functions...).Sort(c.Data)

}

// Loop function
func (c *Collection) Loop(iter func(item LoadableItem) error) error {
	for index := range c.Data {
		err := iter(c.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (c *Collection) Len() int {
	return len(c.Data)
}

// MarshalJSON custom functionality
func (c *Collection) MarshalJSON() ([]byte, error) {
	return json.Marshal(c.Data)
}
