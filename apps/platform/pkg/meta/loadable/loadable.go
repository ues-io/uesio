package loadable

type GroupIterator func(item Item, index interface{}) error

// Group interface
type Group interface {
	GetItem(index int) Item
	Loop(iter GroupIterator) error
	Len() int
	NewItem() Item
	GetItems() interface{}
}

// Item interface
type Item interface {
	SetField(string, interface{}) error
	GetField(string) (interface{}, error)
	Loop(iter func(string, interface{}) error) error
	Len() int
}
