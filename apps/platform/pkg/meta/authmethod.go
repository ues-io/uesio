package meta

import (
	"errors"
	"fmt"

	"github.com/humandad/yaml"
)

// NewDataSource function
func NewAuthMethod(key string) (*AuthMethod, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for AuthMethod: " + key)
	}
	return &AuthMethod{
		Name:      name,
		Namespace: namespace,
	}, nil
}

// AuthMethod struct
type AuthMethod struct {
	ID          string     `yaml:"-" uesio:"uesio/core.id"`
	Name        string     `yaml:"name" uesio:"uesio/studio.name"`
	Namespace   string     `yaml:"-" uesio:"-"`
	Type        string     `yaml:"type" uesio:"uesio/studio.type"`
	Credentials string     `yaml:"credentials" uesio:"uesio/studio.credentials"`
	Workspace   *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	itemMeta    *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy   *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner       *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy   *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt   int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt   int64      `yaml:"-" uesio:"uesio/core.createdat"`
	Public      bool       `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

// GetCollectionName function
func (am *AuthMethod) GetCollectionName() string {
	return am.GetBundleGroup().GetName()
}

// GetCollection function
func (am *AuthMethod) GetCollection() CollectionableGroup {
	var amc AuthMethodCollection
	return &amc
}

func (am *AuthMethod) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, am.Name)
}

// GetBundleGroup function
func (am *AuthMethod) GetBundleGroup() BundleableGroup {
	var amc AuthMethodCollection
	return &amc
}

// GetKey function
func (am *AuthMethod) GetKey() string {
	return fmt.Sprintf("%s.%s", am.Namespace, am.Name)
}

// GetPath function
func (am *AuthMethod) GetPath() string {
	return am.Name + ".yaml"
}

// GetPermChecker function
func (am *AuthMethod) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (am *AuthMethod) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(am, fieldName, value)
}

// GetField function
func (am *AuthMethod) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(am, fieldName)
}

// GetNamespace function
func (am *AuthMethod) GetNamespace() string {
	return am.Namespace
}

// SetNamespace function
func (am *AuthMethod) SetNamespace(namespace string) {
	am.Namespace = namespace
}

// SetWorkspace function
func (am *AuthMethod) SetWorkspace(workspace string) {
	am.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (am *AuthMethod) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(am, iter)
}

// Len function
func (am *AuthMethod) Len() int {
	return StandardItemLen(am)
}

// GetItemMeta function
func (am *AuthMethod) GetItemMeta() *ItemMeta {
	return am.itemMeta
}

// SetItemMeta function
func (am *AuthMethod) SetItemMeta(itemMeta *ItemMeta) {
	am.itemMeta = itemMeta
}

func (am *AuthMethod) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, am.Name)
	if err != nil {
		return err
	}
	return node.Decode(am)
}

func (am *AuthMethod) IsPublic() bool {
	return am.Public
}
