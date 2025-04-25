package meta

type GroupIterator func(item Item, index string) error

type Group interface {
	Loop(iter GroupIterator) error
	Len() int
	NewItem() Item
	AddItem(Item) error
}

type Item interface {
	GetField(string) (any, error)
	SetField(string, any) error
	Loop(iter func(string, any) error) error
	Len() int
}
