package loadable

// Group interface
type Group interface {
	GetItem(index int) Item
	Loop(iter func(item Item) error) error
	Len() int
	AddItem(Item)
	NewItem() Item
	GetItems() interface{}
	Slice(start int, end int)
}

// Item interface
type Item interface {
	SetField(string, interface{}) error
	GetField(string) (interface{}, error)
}
