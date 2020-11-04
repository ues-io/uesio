package metadata

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// NewFileSource function
func NewFileSource(key string) (*FileSource, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for FileSource")
	}
	return &FileSource{
		Name:      name,
		Namespace: namespace,
	}, nil
}

// FileSource struct
type FileSource struct {
	Name      string `uesio:"name"`
	Namespace string `uesio:"-"`
	TypeRef   string `yaml:"type" uesio:"-"`
	Database  string `uesio:"-"`
	Username  string `uesio:"-"`
	Password  string `uesio:"-"`
	Workspace string `uesio:"uesio.workspaceid"`
}

// GetAdapterType function
func (fs *FileSource) GetAdapterType() string {
	return fs.TypeRef
}

// GetCollectionName function
func (fs *FileSource) GetCollectionName() string {
	return fs.GetBundleGroup().GetName()
}

// GetCollection function
func (fs *FileSource) GetCollection() CollectionableGroup {
	var fsc FileSourceCollection
	return &fsc
}

// GetConditions function
func (fs *FileSource) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: fs.Name,
		},
	}, nil
}

// GetBundleGroup function
func (fs *FileSource) GetBundleGroup() BundleableGroup {
	var fsc FileSourceCollection
	return &fsc
}

// GetCredentials function
//TODO:: Dig into what this should be
func (fs *FileSource) GetCredentials(site *Site) (*creds.FileAdapterCredentials, error) {
	database, err := MergeConfigValue(fs.Database, site)
	if err != nil {
		return nil, err
	}
	username, err := GetSecret(fs.Username, site)
	if err != nil {
		return nil, err
	}
	password, err := GetSecret(fs.Password, site)
	if err != nil {
		return nil, err
	}

	return &creds.FileAdapterCredentials{
		Database: database,
		Username: username,
		Password: password,
	}, nil
}

// GetKey function
func (fs *FileSource) GetKey() string {
	return fs.Namespace + "." + fs.Name
}

// GetPermChecker function
func (fs *FileSource) GetPermChecker() *PermissionSet {
	return nil
}

// GetNamespace function
func (fs *FileSource) GetNamespace() string {
	return fs.Namespace
}

// SetNamespace function
func (fs *FileSource) SetNamespace(namespace string) {
	fs.Namespace = namespace
}

// SetWorkspace function
func (fs *FileSource) SetWorkspace(workspace string) {
	fs.Workspace = workspace
}
