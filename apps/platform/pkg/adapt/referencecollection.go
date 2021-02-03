package adapt

import (
	"fmt"

	"github.com/jinzhu/copier"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type ReferenceCollection struct {
	ReferencedCollection *ReferenceRequest
	Collection           loadable.Group
	CollectionMetadata   *CollectionMetadata
	NewCollection        Collection
}

// GetItem function
func (c *ReferenceCollection) GetItem(index int) loadable.Item {
	return c.NewCollection.GetItem(index)
}

//GetItems function
func (c *ReferenceCollection) GetItems() interface{} {
	return c.NewCollection.GetItems()
}

// Slice function
func (c *ReferenceCollection) Slice(start int, end int) {
	c.NewCollection.Slice(start, end)
}

// AddItem function
func (c *ReferenceCollection) AddItem(refItem loadable.Item) {

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

	matchIndexes, ok := c.ReferencedCollection.IDs[refFKAsString]
	if !ok {
		return
	}

	for _, index := range matchIndexes {
		for _, reference := range c.ReferencedCollection.ReferenceFields {
			referenceValue := Item{}

			err = copier.Copy(&referenceValue, refItem)
			if err != nil {
				fmt.Println("GOT ERROR IN REFERENCE: " + err.Error())
				return
			}

			item := c.Collection.GetItem(index)
			err = item.SetField(reference.GetFullName(), referenceValue)
			if err != nil {
				fmt.Println("GOT ERROR IN REFERENCE: " + err.Error())
				return
			}
		}
	}

	c.NewCollection.AddItem(refItem)
}

// NewItem function
func (c *ReferenceCollection) NewItem() loadable.Item {
	return &Item{}
}

// Loop function
func (c *ReferenceCollection) Loop(iter func(item loadable.Item) error) error {
	return c.NewCollection.Loop(iter)
}

// Len function
func (c *ReferenceCollection) Len() int {
	return c.NewCollection.Len()
}
