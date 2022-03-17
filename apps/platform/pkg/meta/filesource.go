package meta

import (
	"errors"
	"fmt"

	"github.com/humandad/yaml"
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
	ID          string     `yaml:"-" uesio:"uesio.id"`
	Name        string     `uesio:"studio.name"`
	Namespace   string     `yaml:"-" uesio:"-"`
	Type        string     `yaml:"type,omitempty" uesio:"-"`
	Credentials string     `yaml:"credentials" uesio:"studio.credentials"`
	Workspace   *Workspace `yaml:"-" uesio:"studio.workspace"`
	itemMeta    *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy   *User      `yaml:"-" uesio:"uesio.createdby"`
	Owner       *User      `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy   *User      `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt   int64      `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt   int64      `yaml:"-" uesio:"uesio.createdat"`
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

func (fs *FileSource) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, fs.Name)
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
	fs.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (fs *FileSource) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(fs, iter)
}

// Len function
func (fs *FileSource) Len() int {
	return StandardItemLen(fs)
}

// GetItemMeta function
func (fs *FileSource) GetItemMeta() *ItemMeta {
	return fs.itemMeta
}

// SetItemMeta function
func (fs *FileSource) SetItemMeta(itemMeta *ItemMeta) {
	fs.itemMeta = itemMeta
}

func (fs *FileSource) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, fs.Name)
	if err != nil {
		return err
	}
	return node.Decode(fs)
}

// IsPublic function
func (c *FileSource) IsPublic() bool {
	return true
}
