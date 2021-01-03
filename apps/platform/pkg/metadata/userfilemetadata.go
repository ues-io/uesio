package metadata

//Represents the "userfile" entry created to track files (Invisible to the user)

// UserFileMetadata struct
type UserFileMetadata struct {
	ID               string `uesio:"uesio.id"`
	CollectionID     string `uesio:"uesio.collectionid"`
	MimeType         string `uesio:"uesio.mimetype"`
	FieldID          string `uesio:"uesio.fieldid"`
	FileCollectionID string `uesio:"uesio.filecollectionid"`
	Name             string `uesio:"uesio.name"`
	Path             string `uesio:"uesio.path"`
	RecordID         string `uesio:"uesio.recordid"`
	WorkspaceID      string `uesio:"uesio.workspaceid"`
	SiteID           string `uesio:"uesio.siteid"`
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
