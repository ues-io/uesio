package meta

import (
	"errors"
)

// NewCredential function
func NewCredential(key string) (*Credential, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Credential: " + key)
	}
	return &Credential{
		Name:      name,
		Namespace: namespace,
	}, nil
}

type CredentialEntry struct {
	Type  string `yaml:"type" uesio:"studio.type"`
	Value string `yaml:"value" uesio:"studio.value"`
}

// Credential struct
type Credential struct {
	ID        string                     `yaml:"-" uesio:"studio.id"`
	Name      string                     `yaml:"name" uesio:"studio.name"`
	Namespace string                     `yaml:"-" uesio:"-"`
	Entries   map[string]CredentialEntry `yaml:"entries" uesio:"studio.entries"`
	TypeRef   string                     `yaml:"type" uesio:"studio.type"`
	Workspace string                     `yaml:"-" uesio:"studio.workspaceid"`
}

// GetCollectionName function
func (c *Credential) GetCollectionName() string {
	return c.GetBundleGroup().GetName()
}

// GetCollection function
func (c *Credential) GetCollection() CollectionableGroup {
	var cc CredentialCollection
	return &cc
}

// GetConditions function
func (c *Credential) GetConditions() map[string]string {
	return map[string]string{
		"studio.name": c.Name,
	}
}

// GetBundleGroup function
func (c *Credential) GetBundleGroup() BundleableGroup {
	var cc CredentialCollection
	return &cc
}

// GetKey function
func (c *Credential) GetKey() string {
	return c.Namespace + "." + c.Name
}

// GetPath function
func (c *Credential) GetPath() string {
	return c.GetKey() + ".yaml"
}

// GetPermChecker function
func (c *Credential) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (c *Credential) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(c, fieldName, value)
}

// GetField function
func (c *Credential) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(c, fieldName)
}

// GetNamespace function
func (c *Credential) GetNamespace() string {
	return c.Namespace
}

// SetNamespace function
func (c *Credential) SetNamespace(namespace string) {
	c.Namespace = namespace
}

// SetWorkspace function
func (c *Credential) SetWorkspace(workspace string) {
	c.Workspace = workspace
}

// Loop function
func (c *Credential) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}
