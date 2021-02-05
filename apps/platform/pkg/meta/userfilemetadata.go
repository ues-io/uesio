package meta

//Represents the "userfile" entry created to track files (Invisible to the user)

// UserFileMetadata struct
type UserFileMetadata struct {
	ID               string `uesio:"uesio.id" json:"uesio.id"`
	CollectionID     string `uesio:"uesio.collectionid" json:"-"`
	MimeType         string `uesio:"uesio.mimetype" json:"uesio.mimetype"`
	FieldID          string `uesio:"uesio.fieldid" json:"-"`
	FileCollectionID string `uesio:"uesio.filecollectionid" json:"-"`
	Name             string `uesio:"uesio.name" json:"-"`
	Path             string `uesio:"uesio.path" json:"-"`
	RecordID         string `uesio:"uesio.recordid" json:"-"`
	WorkspaceID      string `uesio:"uesio.workspaceid" json:"-"`
	SiteID           string `uesio:"uesio.siteid" json:"-"`
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
