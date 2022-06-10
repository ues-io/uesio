package meta

type ValidationMetadata struct {
	Type     string    `json:"type" yaml:"type,omitempty" uesio:"uesio/studio.type"`
	Regex    string    `json:"regex" yaml:"regex,omitempty" uesio:"uesio/studio.regex"`
	itemMeta *ItemMeta `yaml:"-" uesio:"-"`
}

func (a *ValidationMetadata) GetCollectionName() string {
	return a.GetCollection().GetName()
}

func (a *ValidationMetadata) GetCollection() CollectionableGroup {
	return nil
}

func (a *ValidationMetadata) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(a, fieldName, value)
}

func (a *ValidationMetadata) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(a, fieldName)
}

func (a *ValidationMetadata) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(a, iter)
}

func (a *ValidationMetadata) Len() int {
	return StandardItemLen(a)
}

func (a *ValidationMetadata) GetItemMeta() *ItemMeta {
	return a.itemMeta
}

func (a *ValidationMetadata) SetItemMeta(itemMeta *ItemMeta) {
	a.itemMeta = itemMeta
}
