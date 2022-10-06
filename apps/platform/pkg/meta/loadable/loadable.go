package loadable

type GroupIterator func(item Item, index string) error

type Group interface {
	GetItem(index int) Item
	Loop(iter GroupIterator) error
	Len() int
	NewItem() Item
	GetItems() interface{}
}

type Gettable interface {
	GetField(string) (interface{}, error)
}

type Item interface {
	Gettable
	SetField(string, interface{}) error
	Loop(iter func(string, interface{}) error) error
	Len() int
}
