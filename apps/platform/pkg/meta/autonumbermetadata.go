package meta

type AutoNumberMetadata struct {
	Prefix       string    `yaml:"prefix,omitempty" json:"uesio/studio.prefix"`
	LeadingZeros int       `yaml:"leadingZeros,omitempty" json:"uesio/studio.leadingzeros"`
	itemMeta     *ItemMeta `yaml:"-" json:"-"`
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
