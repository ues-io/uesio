package meta

type NumberMetadata struct {
	Decimals int       `json:"uesio/studio.decimals"`
	itemMeta *ItemMeta `yaml:"-" json:"-"`
}

func (a *NumberMetadata) GetCollectionName() string {
	return a.GetCollection().GetName()
}

func (a *NumberMetadata) GetCollection() CollectionableGroup {
	return nil
}

func (a *NumberMetadata) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(a, fieldName, value)
}

func (a *NumberMetadata) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(a, fieldName)
}

func (a *NumberMetadata) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(a, iter)
}

func (a *NumberMetadata) Len() int {
	return StandardItemLen(a)
}

func (a *NumberMetadata) GetItemMeta() *ItemMeta {
	return a.itemMeta
}

func (a *NumberMetadata) SetItemMeta(itemMeta *ItemMeta) {
	a.itemMeta = itemMeta
}
