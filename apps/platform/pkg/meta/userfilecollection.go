package meta

import (
	"errors"

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
	Workspace  string
}

// GetFileSource function
func (ufc *UserFileCollection) GetFileSource() string {
	return ufc.FileSource
}

// GetPath function
func (ufc *UserFileCollection) GetFilePath(userFile *UserFileMetadata, siteID, workspaceID string) (string, error) {
	template, err := templating.NewRequiredKey(ufc.PathFormat)
	if err != nil {
		return "", err
	}

	mergeObj := map[string]interface{}{
		"workspaceid":      workspaceID,
		"name":             userFile.Name,
		"recordid":         userFile.RecordID,
		"fieldid":          userFile.FieldID,
		"collectionid":     userFile.CollectionID,
		"filecollectionid": userFile.FileCollectionID,
		"siteid":           siteID,
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
func (ufc *UserFileCollection) GetConditions() map[string]string {
	return map[string]string{
		"uesio.name": ufc.Name,
	}
}

// GetBundleGroup function
func (ufc *UserFileCollection) GetBundleGroup() BundleableGroup {
	var ufcc UserFileCollectionCollection
	return &ufcc
}

// SetField function
func (ufc *UserFileCollection) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ufc, fieldName, value)
}

// GetField function
func (ufc *UserFileCollection) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ufc, fieldName)
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
	ufc.Workspace = workspace
}

// GetKey function
func (ufc *UserFileCollection) GetKey() string {
	return ufc.Namespace + "." + ufc.Name
}

// GetPath function
func (ufc *UserFileCollection) GetPath() string {
	return ufc.GetKey() + ".yaml"
}

// GetPermChecker function
func (ufc *UserFileCollection) GetPermChecker() *PermissionSet {
	return nil
}

// Loop function
func (ufc *UserFileCollection) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ufc, iter)
}
