package meta

import (
	"errors"
)

// NewCollection function
func NewCollection(key string) (*Collection, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Collection: " + key)
	}
	return &Collection{
		Name:      name,
		Namespace: namespace,
	}, nil
}

type UserResponseTokenDefinition struct {
	Type       string            `yaml:"type"`
	Collection string            `yaml:"collection"`
	Token      string            `yaml:"token"`
	Match      string            `yaml:"match"`
	Conditions []*TokenCondition `yaml:"conditions"`
}

type TokenCondition struct {
	Field string `yaml:"field"`
	Value string `yaml:"value"`
}

// Collection struct
type Collection struct {
	ID             string    `yaml:"-" uesio:"studio.id"`
	Name           string    `yaml:"name" uesio:"studio.name"`
	Namespace      string    `yaml:"-" uesio:"-"`
	DataSourceRef  string    `yaml:"dataSource" uesio:"studio.datasource"`
	IDField        string    `yaml:"idField" uesio:"studio.idfield"`
	IDFormat       string    `yaml:"idFormat,omitempty" uesio:"studio.idformat"`
	NameField      string    `yaml:"nameField" uesio:"studio.namefield"`
	CollectionName string    `yaml:"collectionName" uesio:"studio.collectionname"`
	ReadOnly       bool      `yaml:"readOnly,omitempty" uesio:"-"`
	Workspace      string    `yaml:"-" uesio:"studio.workspaceid"`
	Updated        int64     `yaml:"-" uesio:"studio.updated"`
	Created        int64     `yaml:"-" uesio:"studio.created"`
	itemMeta       *ItemMeta `yaml:"-" uesio:"-"`
	Access         string    `yaml:"access,omitempty" uesio:"studio.access"`
	//TODO:: JAS Figure out if we want/how we want to handle a uesio encoding
	UserResponseTokens []*UserResponseTokenDefinition `yaml:"userResponseTokens,omitempty" uesio:"-"`
}

// GetCollectionName function
func (c *Collection) GetCollectionName() string {
	return c.GetBundleGroup().GetName()
}

// GetCollection function
func (c *Collection) GetCollection() CollectionableGroup {
	var cc CollectionCollection
	return &cc
}

// GetConditions function
func (c *Collection) GetConditions() map[string]string {
	return map[string]string{
		"studio.name": c.Name,
	}
}

// GetBundleGroup function
func (c *Collection) GetBundleGroup() BundleableGroup {
	var cc CollectionCollection
	return &cc
}

// GetKey function
func (c *Collection) GetKey() string {
	return c.Namespace + "." + c.Name
}

// GetPath function
func (c *Collection) GetPath() string {
	return c.GetKey() + ".yaml"
}

// GetPermChecker function
func (c *Collection) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (c *Collection) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(c, fieldName, value)
}

// GetField function
func (c *Collection) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(c, fieldName)
}

// GetNamespace function
func (c *Collection) GetNamespace() string {
	return c.Namespace
}

// SetNamespace function
func (c *Collection) SetNamespace(namespace string) {
	c.Namespace = namespace
}

// SetWorkspace function
func (c *Collection) SetWorkspace(workspace string) {
	c.Workspace = workspace
}

// Loop function
func (c *Collection) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}

// GetItemMeta function
func (c *Collection) GetItemMeta() *ItemMeta {
	return c.itemMeta
}

// SetItemMeta function
func (c *Collection) SetItemMeta(itemMeta *ItemMeta) {
	c.itemMeta = itemMeta
}
