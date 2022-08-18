package meta

type UserFileMetadata struct {
	ID               string    `uesio:"uesio/core.id" json:"uesio/core.id"`
	UniqueKey        string    `yaml:"-" uesio:"uesio/core.uniquekey"`
	CollectionID     string    `uesio:"uesio/core.collectionid" json:"-"`
	MimeType         string    `uesio:"uesio/core.mimetype" json:"uesio/core.mimetype"`
	FieldID          string    `uesio:"uesio/core.fieldid" json:"-"`
	FileCollectionID string    `uesio:"uesio/core.filecollectionid" json:"-"`
	Name             string    `uesio:"uesio/core.name" json:"-"`
	FileName         string    `uesio:"uesio/core.filename" json:"uesio/core.filename"`
	Path             string    `uesio:"uesio/core.path" json:"-"`
	RecordID         string    `uesio:"uesio/core.recordid" json:"-"`
	Type             string    `uesio:"uesio/core.type" json:"-"`
	CreatedBy        *User     `yaml:"-" uesio:"uesio/core.createdby" json:"-"`
	Owner            *User     `yaml:"-" uesio:"uesio/core.owner" json:"-"`
	UpdatedBy        *User     `yaml:"-" uesio:"uesio/core.updatedby" json:"-"`
	UpdatedAt        int64     `yaml:"-" uesio:"uesio/core.updatedat" json:"uesio/core.updatedat"`
	CreatedAt        int64     `yaml:"-" uesio:"uesio/core.createdat" json:"uesio/core.createdat"`
	itemMeta         *ItemMeta `yaml:"-" uesio:"-" json:"-"`
}

func (ufm *UserFileMetadata) GetCollectionName() string {
	return ufm.GetCollection().GetName()
}

func (ufm *UserFileMetadata) GetCollection() CollectionableGroup {
	var ufmc UserFileMetadataCollection
	return &ufmc
}

func (ufm *UserFileMetadata) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ufm, fieldName, value)
}

func (ufm *UserFileMetadata) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ufm, fieldName)
}

func (ufm *UserFileMetadata) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ufm, iter)
}

func (ufm *UserFileMetadata) Len() int {
	return StandardItemLen(ufm)
}

func (ufm *UserFileMetadata) GetItemMeta() *ItemMeta {
	return ufm.itemMeta
}

func (ufm *UserFileMetadata) SetItemMeta(itemMeta *ItemMeta) {
	ufm.itemMeta = itemMeta
}
