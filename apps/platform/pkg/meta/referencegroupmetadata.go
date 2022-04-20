package meta

type ReferenceGroupMetadata struct {
	Collection string    `json:"collection" yaml:"collection,omitempty" uesio:"uesio/studio.collection"`
	Field      string    `json:"field" yaml:"field,omitempty" uesio:"uesio/studio.field"`
	OnDelete   string    `json:"onDelete" yaml:"onDelete,omitempty" uesio:"uesio/studio.ondelete"`
	itemMeta   *ItemMeta `yaml:"-" uesio:"-"`
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
