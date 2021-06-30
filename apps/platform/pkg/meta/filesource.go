package meta

import (
	"errors"
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
	ID          string    `yaml:"-" uesio:"studio.id"`
	Name        string    `uesio:"studio.name"`
	Namespace   string    `yaml:"-" uesio:"-"`
	Type        string    `yaml:"type,omitempty" uesio:"-"`
	Credentials string    `yaml:"credentials" uesio:"studio.credentials"`
	Workspace   string    `uesio:"studio.workspaceid"`
	itemMeta    *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy   *User     `yaml:"-" uesio:"studio.createdby"`
	UpdatedBy   *User     `yaml:"-" uesio:"studio.updatedby"`
	UpdatedAt   float64   `yaml:"-" uesio:"studio.updatedat"`
	CreatedAt   float64   `yaml:"-" uesio:"studio.createdat"`
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
func (fs *FileSource) GetConditions() map[string]string {
	return map[string]string{
		"studio.name": fs.Name,
	}
}

// GetBundleGroup function
func (fs *FileSource) GetBundleGroup() BundleableGroup {
	var fsc FileSourceCollection
	return &fsc
}

// GetKey function
func (fs *FileSource) GetKey() string {
	return fs.Namespace + "." + fs.Name
}

// GetPath function
func (fs *FileSource) GetPath() string {
	return fs.GetKey() + ".yaml"
}

// GetPermChecker function
func (fs *FileSource) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (fs *FileSource) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(fs, fieldName, value)
}

// GetField function
func (fs *FileSource) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(fs, fieldName)
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

// Loop function
func (fs *FileSource) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(fs, iter)
}

// GetItemMeta function
func (fs *FileSource) GetItemMeta() *ItemMeta {
	return fs.itemMeta
}

// SetItemMeta function
func (fs *FileSource) SetItemMeta(itemMeta *ItemMeta) {
	fs.itemMeta = itemMeta
}
