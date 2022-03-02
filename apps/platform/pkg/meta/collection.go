package meta

import (
	"errors"
	"fmt"

	"github.com/humandad/yaml"
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

type RecordChallengeTokenDefinition struct {
	Type            string            `yaml:"type"`
	Collection      string            `yaml:"collection"`
	Token           string            `yaml:"token"`
	UserAccessToken string            `yaml:"userAccessToken"`
	Access          string            `yaml:"access"`
	Conditions      []*TokenCondition `yaml:"conditions"`
}

type TokenCondition struct {
	Field string `yaml:"field"`
	Value string `yaml:"value"`
}

// Collection struct
type Collection struct {
	ID                    string                            `yaml:"-" uesio:"uesio.id"`
	Name                  string                            `yaml:"name" uesio:"studio.name"`
	Namespace             string                            `yaml:"-" uesio:"-"`
	DataSourceRef         string                            `yaml:"dataSource" uesio:"studio.datasource"`
	IDFormat              string                            `yaml:"idFormat,omitempty" uesio:"studio.idformat"`
	NameField             string                            `yaml:"nameField" uesio:"studio.namefield"`
	ReadOnly              bool                              `yaml:"readOnly,omitempty" uesio:"-"`
	Workspace             *Workspace                        `yaml:"-" uesio:"studio.workspace"`
	CreatedBy             *User                             `yaml:"-" uesio:"uesio.createdby"`
	Owner                 *User                             `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy             *User                             `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt             int64                             `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt             int64                             `yaml:"-" uesio:"uesio.createdat"`
	itemMeta              *ItemMeta                         `yaml:"-" uesio:"-"`
	Access                string                            `yaml:"access,omitempty" uesio:"studio.access"`
	RecordChallengeTokens []*RecordChallengeTokenDefinition `yaml:"recordChallengeTokens,omitempty" uesio:"-"`
	TableName             string                            `yaml:"tablename,omitempty" uesio:"studio.tablename"`
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

func (c *Collection) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, c.Name)
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
	key := c.GetKey()
	return &PermissionSet{
		CollectionRefs: map[string]bool{
			key: true,
		},
	}
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
	c.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (c *Collection) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}

// Len function
func (c *Collection) Len() int {
	return StandardItemLen(c)
}

// GetItemMeta function
func (c *Collection) GetItemMeta() *ItemMeta {
	return c.itemMeta
}

// SetItemMeta function
func (c *Collection) SetItemMeta(itemMeta *ItemMeta) {
	c.itemMeta = itemMeta
}

func (c *Collection) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, c.Name)
	if err != nil {
		return err
	}
	err = setDefaultValue(node, "dataSource", "uesio.platform")
	if err != nil {
		return err
	}
	return node.Decode(c)
}
