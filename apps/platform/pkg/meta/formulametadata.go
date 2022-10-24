package meta

type FormulaMetadata struct {
	Expression string    `yaml:"expression,omitempty" json:"uesio/studio.expression"`
	ReturnType string    `yaml:"returntype,omitempty" json:"uesio/studio.returntype"`
	itemMeta   *ItemMeta `yaml:"-" json:"-"`
}

func (a *FormulaMetadata) GetCollectionName() string {
	return a.GetCollection().GetName()
}

func (a *FormulaMetadata) GetCollection() CollectionableGroup {
	return nil
}

func (a *FormulaMetadata) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(a, fieldName, value)
}

func (a *FormulaMetadata) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(a, fieldName)
}

func (a *FormulaMetadata) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(a, iter)
}

func (a *FormulaMetadata) Len() int {
	return StandardItemLen(a)
}

func (a *FormulaMetadata) GetItemMeta() *ItemMeta {
	return a.itemMeta
}

func (a *FormulaMetadata) SetItemMeta(itemMeta *ItemMeta) {
	a.itemMeta = itemMeta
}
