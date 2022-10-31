package meta

type FieldMapping struct {
	Type       string    `json:"type"`
	ColumnName string    `json:"columnname"`
	Value      string    `json:"value"`
	itemMeta   *ItemMeta `json:"-"`
}

func (a *FieldMapping) GetCollectionName() string {
	return a.GetCollection().GetName()
}

func (a *FieldMapping) GetCollection() CollectionableGroup {
	return nil
}

func (a *FieldMapping) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(a, fieldName, value)
}

func (a *FieldMapping) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(a, fieldName)
}

func (a *FieldMapping) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(a, iter)
}

func (a *FieldMapping) Len() int {
	return StandardItemLen(a)
}

func (a *FieldMapping) GetItemMeta() *ItemMeta {
	return a.itemMeta
}

func (a *FieldMapping) SetItemMeta(itemMeta *ItemMeta) {
	a.itemMeta = itemMeta
}
