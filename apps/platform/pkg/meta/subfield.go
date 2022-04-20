package meta

type SubField struct {
	Name       string    `yaml:"name,omitempty" uesio:"uesio/studio.name"`
	Label      string    `yaml:"label,omitempty" uesio:"uesio/studio.label"`
	Type       string    `yaml:"type,omitempty" uesio:"uesio/studio.type"`
	SelectList string    `yaml:"selectList,omitempty" uesio:"uesio/studio.selectlist"`
	itemMeta   *ItemMeta `yaml:"-" uesio:"-"`
}

func (a *SubField) GetCollectionName() string {
	return a.GetCollection().GetName()
}

func (a *SubField) GetCollection() CollectionableGroup {
	return nil
}

func (a *SubField) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(a, fieldName, value)
}

func (a *SubField) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(a, fieldName)
}

func (a *SubField) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(a, iter)
}

func (a *SubField) Len() int {
	return StandardItemLen(a)
}

func (a *SubField) GetItemMeta() *ItemMeta {
	return a.itemMeta
}

func (a *SubField) SetItemMeta(itemMeta *ItemMeta) {
	a.itemMeta = itemMeta
}
