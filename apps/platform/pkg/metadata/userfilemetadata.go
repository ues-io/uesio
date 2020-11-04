package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

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

// GetConditions function
func (ufm *UserFileMetadata) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: ufm.Name,
		},
	}, nil
}

// GetNamespace function
func (ufm *UserFileMetadata) GetNamespace() string {
	return ""
}

// SetNamespace function
func (ufm *UserFileMetadata) SetNamespace(namespace string) {
	//u.Namespace = namespace
}

// SetWorkspace function
func (ufm *UserFileMetadata) SetWorkspace(workspace string) {

}

// GetKey function
func (ufm *UserFileMetadata) GetKey() string {
	return ufm.Name
}

// GetPermChecker function
func (ufm *UserFileMetadata) GetPermChecker() *PermissionSet {
	return nil
}
