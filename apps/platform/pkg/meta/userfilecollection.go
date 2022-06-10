package meta

import (
	"errors"
	"fmt"
	"time"

	"github.com/thecloudmasters/uesio/pkg/templating"
)

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

type UserFileCollection struct {
	ID         string `yaml:"-" uesio:"uesio/core.id"`
	Name       string `yaml:"name" uesio:"uesio/studio.name"`
	Namespace  string `yaml:"-" uesio:"-"`
	FileSource string
	Bucket     string     `yaml:"bucket"`
	PathFormat string     `yaml:"pathFormat"`
	Workspace  *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	itemMeta   *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy  *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner      *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy  *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt  int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt  int64      `yaml:"-" uesio:"uesio/core.createdat"`
	Public     bool       `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

func (ufc *UserFileCollection) GetFileSource() string {
	return ufc.FileSource
}

func (ufc *UserFileCollection) GetFilePath(userFile *UserFileMetadata) (string, error) {
	template, err := templating.NewTemplateWithValidKeysOnly(ufc.PathFormat)
	if err != nil {
		return "", err
	}

	mergeObj := map[string]interface{}{
		"name":         userFile.Name,
		"recordid":     userFile.RecordID,
		"fieldid":      userFile.FieldID,
		"collectionid": userFile.CollectionID,
		"type":         userFile.Type,
	}
	return templating.Execute(template, mergeObj)
}

func (ufc *UserFileCollection) GetCollectionName() string {
	return ufc.GetBundleGroup().GetName()
}

func (ufc *UserFileCollection) GetCollection() CollectionableGroup {
	var ufcc UserFileCollectionCollection
	return &ufcc
}

func (ufc *UserFileCollection) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, ufc.Name)
}

func (ufc *UserFileCollection) GetBundleGroup() BundleableGroup {
	var ufcc UserFileCollectionCollection
	return &ufcc
}

func (ufc *UserFileCollection) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ufc, fieldName, value)
}

func (ufc *UserFileCollection) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ufc, fieldName)
}

func (ufc *UserFileCollection) GetNamespace() string {
	return ufc.Namespace
}

func (ufc *UserFileCollection) SetNamespace(namespace string) {
	ufc.Namespace = namespace
}

func (ufc *UserFileCollection) SetWorkspace(workspace string) {
	ufc.Workspace = &Workspace{
		ID: workspace,
	}
}

func (ufc *UserFileCollection) SetModified(mod time.Time) {
	ufc.UpdatedAt = mod.UnixMilli()
}

func (ufc *UserFileCollection) GetKey() string {
	return fmt.Sprintf("%s.%s", ufc.Namespace, ufc.Name)
}

func (ufc *UserFileCollection) GetPath() string {
	return ufc.Name + ".yaml"
}

func (ufc *UserFileCollection) GetPermChecker() *PermissionSet {
	return nil
}

func (ufc *UserFileCollection) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ufc, iter)
}

func (ufc *UserFileCollection) Len() int {
	return StandardItemLen(ufc)
}

func (ufc *UserFileCollection) GetItemMeta() *ItemMeta {
	return ufc.itemMeta
}

func (ufc *UserFileCollection) SetItemMeta(itemMeta *ItemMeta) {
	ufc.itemMeta = itemMeta
}

func (ufc *UserFileCollection) IsPublic() bool {
	return ufc.Public
}
