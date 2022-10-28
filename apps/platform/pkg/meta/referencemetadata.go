package meta

type ReferenceMetadata struct {
	Collection string    `yaml:"collection,omitempty" json:"uesio/studio.collection"`
	itemMeta   *ItemMeta `yaml:"-" json:"-"`
}

func (a *ReferenceMetadata) GetCollectionName() string {
	return a.GetCollection().GetName()
}

func (a *ReferenceMetadata) GetCollection() CollectionableGroup {
	return nil
}

func (a *ReferenceMetadata) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(a, fieldName, value)
}

func (a *ReferenceMetadata) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(a, fieldName)
}

func (a *ReferenceMetadata) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(a, iter)
}

func (a *ReferenceMetadata) Len() int {
	return StandardItemLen(a)
}

func (a *ReferenceMetadata) GetItemMeta() *ItemMeta {
	return a.itemMeta
}

func (a *ReferenceMetadata) SetItemMeta(itemMeta *ItemMeta) {
	a.itemMeta = itemMeta
}
