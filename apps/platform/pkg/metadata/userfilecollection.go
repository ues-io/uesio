package metadata

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

// NewUserFileCollection function
func NewUserFileCollection(key string) (*UserFileCollection, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Userfilecollection")
	}
	return &UserFileCollection{
		Name:      name,
		Namespace: namespace,
	}, nil
}

//Represents "File Collections" as far as the user is concerned

// UserFileCollection struct
type UserFileCollection struct {
	Name       string
	Namespace  string
	FileSource string
	Bucket     string `yaml:"bucket"`
	PathFormat string `yaml:"pathFormat"`
}

// GetFileSource function
func (ufc *UserFileCollection) GetFileSource() string {
	return ufc.FileSource
}

// GetBucket function
func (ufc *UserFileCollection) GetBucket(site *Site) (string, error) {
	return GetConfigValue(ufc.Bucket, site)
}

// GetPath function
func (ufc *UserFileCollection) GetPath(userFile *UserFileMetadata, site *Site) (string, error) {
	template, err := templating.New(ufc.PathFormat)
	if err != nil {
		return "", err
	}

	mergeObj := map[string]interface{}{
		"workspaceid":      site.GetWorkspaceID(),
		"name":             userFile.Name,
		"recordid":         userFile.RecordID,
		"fieldid":          userFile.FieldID,
		"collectionid":     userFile.CollectionID,
		"filecollectionid": userFile.FileCollectionID,
		"siteid":           site.Name,
	}
	return templating.Execute(template, mergeObj)
}

// GetCollectionName function
func (ufc *UserFileCollection) GetCollectionName() string {
	return ufc.GetBundleGroup().GetName()
}

// GetCollection function
func (ufc *UserFileCollection) GetCollection() CollectionableGroup {
	var ufcc UserFileCollectionCollection
	return &ufcc
}

// GetConditions function
func (ufc *UserFileCollection) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: ufc.Name,
		},
	}, nil
}

// GetBundleGroup function
func (ufc *UserFileCollection) GetBundleGroup() BundleableGroup {
	var ufcc UserFileCollectionCollection
	return &ufcc
}

// GetNamespace function
func (ufc *UserFileCollection) GetNamespace() string {
	return ufc.Namespace
}

// SetNamespace function
func (ufc *UserFileCollection) SetNamespace(namespace string) {
	ufc.Namespace = namespace
}

// SetWorkspace function
func (ufc *UserFileCollection) SetWorkspace(workspace string) {

}

// GetKey function
func (ufc *UserFileCollection) GetKey() string {
	return ufc.Namespace + "." + ufc.Name
}

// GetPermChecker function
func (ufc *UserFileCollection) GetPermChecker() *PermissionSet {
	return nil
}
