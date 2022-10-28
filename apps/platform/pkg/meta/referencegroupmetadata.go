package meta

type ReferenceGroupMetadata struct {
	Collection string    `yaml:"collection,omitempty" json:"uesio/studio.collection"`
	Field      string    `yaml:"field,omitempty" json:"uesio/studio.field"`
	OnDelete   string    `yaml:"onDelete,omitempty" json:"uesio/studio.ondelete"`
	itemMeta   *ItemMeta `yaml:"-" json:"-"`
}

func (a *ReferenceGroupMetadata) GetCollectionName() string {
	return a.GetCollection().GetName()
}

func (a *ReferenceGroupMetadata) GetCollection() CollectionableGroup {
	return nil
}

func (a *ReferenceGroupMetadata) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(a, fieldName, value)
}

func (a *ReferenceGroupMetadata) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(a, fieldName)
}

func (a *ReferenceGroupMetadata) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(a, iter)
}

func (a *ReferenceGroupMetadata) Len() int {
	return StandardItemLen(a)
}

func (a *ReferenceGroupMetadata) GetItemMeta() *ItemMeta {
	return a.itemMeta
}

func (a *ReferenceGroupMetadata) SetItemMeta(itemMeta *ItemMeta) {
	a.itemMeta = itemMeta
}
