package adapters

import (
	"fmt"

	"github.com/jinzhu/copier"
)

type ReferenceCollection struct {
	Collection           LoadableGroup
	ReferencedCollection *ReferenceRequest
	CollectionMetadata   *CollectionMetadata
	NewCollection        LoadableGroup
}

// GetItem function
func (c *ReferenceCollection) GetItem(index int) LoadableItem {
	return c.NewCollection.GetItem(index)
}

//GetItems function
func (c *ReferenceCollection) GetItems() interface{} {
	return c.NewCollection.GetItems()
}

// Slice function
func (c *ReferenceCollection) Slice(start int, end int) {
}

// AddItem function
func (c *ReferenceCollection) AddItem(refItem LoadableItem) {

	refFK, err := refItem.GetField(c.ReferencedCollection.Metadata.IDField)
	if err != nil {
		return
	}

	refFKAsString, ok := refFK.(string)
	if !ok {
		//Was unable to convert foreign key to a string!
		//Something has gone sideways!
		return
	}

	if refFKAsString == "" {
		return
	}

	err = c.Collection.Loop(func(item LoadableItem) error {

		for _, reference := range c.ReferencedCollection.ReferenceFields {
			fk, err := item.GetField(reference.ForeignKeyField)
			if err != nil {
				//No value for that reference field to map against
				continue
			}
			fkAsString, ok := fk.(string)
			if !ok {
				//Was unable to convert foreign key to a string!
				//Something has gone sideways!
				continue
			}

			if refFKAsString != fkAsString {
				// Not a match
				continue
			}

			referenceValue := Item{}

			err = copier.Copy(&referenceValue, refItem)
			if err != nil {
				return err
			}

			err = item.SetField(reference.GetFullName(), referenceValue)
			if err != nil {
				return err
			}

			c.NewCollection.AddItem(&referenceValue)
		}

		return nil

	})
	if err != nil {
		fmt.Println("GOT ERROR IN REFERENCE: " + err.Error())
	}

}

// NewItem function
func (c *ReferenceCollection) NewItem() LoadableItem {
	return &Item{}
}

// Loop function
func (c *ReferenceCollection) Loop(iter func(item LoadableItem) error) error {
	return c.NewCollection.Loop(iter)
}

// Len function
func (c *ReferenceCollection) Len() int {
	return c.NewCollection.Len()
}
