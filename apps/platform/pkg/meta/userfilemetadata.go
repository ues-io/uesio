package meta

//Represents the "userfile" entry created to track files (Invisible to the user)

// UserFileMetadata struct
type UserFileMetadata struct {
	ID               string    `uesio:"uesio/core.id" json:"uesio.id"`
	CollectionID     string    `uesio:"uesio/core.collectionid" json:"-"`
	MimeType         string    `uesio:"uesio/core.mimetype" json:"uesio.mimetype"`
	FieldID          string    `uesio:"uesio/core.fieldid" json:"-"`
	FileCollectionID string    `uesio:"uesio/core.filecollectionid" json:"-"`
	Name             string    `uesio:"uesio/core.name" json:"-"`
	FileName         string    `uesio:"uesio/core.filename" json:"-"`
	Path             string    `uesio:"uesio/core.path" json:"-"`
	RecordID         string    `uesio:"uesio/core.recordid" json:"-"`
	Type             string    `uesio:"uesio/core.type" json:"-"`
	CreatedBy        *User     `yaml:"-" uesio:"uesio/core.createdby"`
	Owner            *User     `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy        *User     `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt        int64     `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt        int64     `yaml:"-" uesio:"uesio/core.createdat"`
	itemMeta         *ItemMeta `yaml:"-" uesio:"-"`
}

// GetCollectionName function
func (ufm *UserFileMetadata) GetCollectionName() string {
	return ufm.GetCollection().GetName()
}

// GetCollection function
func (ufm *UserFileMetadata) GetCollection() CollectionableGroup {
	var ufmc UserFileMetadataCollection
	return &ufmc
}

// SetField function
func (ufm *UserFileMetadata) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ufm, fieldName, value)
}

// GetField function
func (ufm *UserFileMetadata) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ufm, fieldName)
}

// Loop function
func (ufm *UserFileMetadata) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ufm, iter)
}

// Len function
func (ufm *UserFileMetadata) Len() int {
	return StandardItemLen(ufm)
}

// GetItemMeta function
func (ufm *UserFileMetadata) GetItemMeta() *ItemMeta {
	return ufm.itemMeta
}

// SetItemMeta function
func (ufm *UserFileMetadata) SetItemMeta(itemMeta *ItemMeta) {
	ufm.itemMeta = itemMeta
}
