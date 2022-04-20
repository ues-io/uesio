package meta

type AutoNumberMetadata struct {
	Prefix       string    `json:"prefix" yaml:"prefix,omitempty" uesio:"uesio/studio.prefix"`
	LeadingZeros int       `json:"leadingZeros" yaml:"leadingZeros,omitempty" uesio:"uesio/studio.leadingzeros"`
	itemMeta     *ItemMeta `yaml:"-" uesio:"-"`
}

func (a *AutoNumberMetadata) GetCollectionName() string {
	return a.GetCollection().GetName()
}

func (a *AutoNumberMetadata) GetCollection() CollectionableGroup {
	return nil
}

func (a *AutoNumberMetadata) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(a, fieldName, value)
}

func (a *AutoNumberMetadata) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(a, fieldName)
}

func (a *AutoNumberMetadata) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(a, iter)
}

func (a *AutoNumberMetadata) Len() int {
	return StandardItemLen(a)
}

func (a *AutoNumberMetadata) GetItemMeta() *ItemMeta {
	return a.itemMeta
}

func (a *AutoNumberMetadata) SetItemMeta(itemMeta *ItemMeta) {
	a.itemMeta = itemMeta
}
