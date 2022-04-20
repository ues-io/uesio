package meta

type FileMetadata struct {
	Accept         string    `json:"accept" yaml:"accept,omitempty" uesio:"uesio/studio.accept"`
	FileCollection string    `json:"filecollection" yaml:"filecollection,omitempty" uesio:"uesio/studio.filecollection"`
	itemMeta       *ItemMeta `yaml:"-" uesio:"-"`
}

func (a *FileMetadata) GetCollectionName() string {
	return a.GetCollection().GetName()
}

func (a *FileMetadata) GetCollection() CollectionableGroup {
	return nil
}

func (a *FileMetadata) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(a, fieldName, value)
}

func (a *FileMetadata) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(a, fieldName)
}

func (a *FileMetadata) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(a, iter)
}

func (a *FileMetadata) Len() int {
	return StandardItemLen(a)
}

func (a *FileMetadata) GetItemMeta() *ItemMeta {
	return a.itemMeta
}

func (a *FileMetadata) SetItemMeta(itemMeta *ItemMeta) {
	a.itemMeta = itemMeta
}
