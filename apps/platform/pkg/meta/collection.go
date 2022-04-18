package meta

import (
	"errors"
	"fmt"

	"github.com/humandad/yaml"
)

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

func NewCollections(keys map[string]bool) ([]BundleableItem, error) {
	items := []BundleableItem{}

	for key := range keys {
		newCollection, err := NewCollection(key)
		if err != nil {
			return nil, err
		}
		items = append(items, newCollection)
	}

	return items, nil
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

type Collection struct {
	ID                    string                            `yaml:"-" uesio:"uesio/core.id"`
	Name                  string                            `yaml:"name" uesio:"uesio/studio.name"`
	Label                 string                            `yaml:"label" uesio:"uesio/studio.label"`
	PluralLabel           string                            `yaml:"pluralLabel" uesio:"uesio/studio.plurallabel"`
	Namespace             string                            `yaml:"-" uesio:"-"`
	DataSourceRef         string                            `yaml:"dataSource" uesio:"uesio/studio.datasource"`
	IDFormat              string                            `yaml:"idFormat,omitempty" uesio:"uesio/studio.idformat"`
	NameField             string                            `yaml:"nameField" uesio:"uesio/studio.namefield"`
	ReadOnly              bool                              `yaml:"readOnly,omitempty" uesio:"-"`
	Workspace             *Workspace                        `yaml:"-" uesio:"uesio/studio.workspace"`
	CreatedBy             *User                             `yaml:"-" uesio:"uesio/core.createdby"`
	Owner                 *User                             `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy             *User                             `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt             int64                             `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt             int64                             `yaml:"-" uesio:"uesio/core.createdat"`
	itemMeta              *ItemMeta                         `yaml:"-" uesio:"-"`
	Access                string                            `yaml:"access,omitempty" uesio:"uesio/studio.access"`
	AccessField           string                            `yaml:"accessField,omitempty" uesio:"-"`
	RecordChallengeTokens []*RecordChallengeTokenDefinition `yaml:"recordChallengeTokens,omitempty" uesio:"-"`
	TableName             string                            `yaml:"tablename,omitempty" uesio:"uesio/studio.tablename"`
	Public                bool                              `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

func (c *Collection) GetCollectionName() string {
	return c.GetBundleGroup().GetName()
}

func (c *Collection) GetCollection() CollectionableGroup {
	var cc CollectionCollection
	return &cc
}

func (c *Collection) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, c.Name)
}

func (c *Collection) GetBundleGroup() BundleableGroup {
	var cc CollectionCollection
	return &cc
}

func (c *Collection) GetKey() string {
	return fmt.Sprintf("%s.%s", c.Namespace, c.Name)
}

func (c *Collection) GetPath() string {
	return c.Name + ".yaml"
}

func (c *Collection) GetPermChecker() *PermissionSet {
	key := c.GetKey()
	return &PermissionSet{
		CollectionRefs: map[string]bool{
			key: true,
		},
	}
}

func (c *Collection) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(c, fieldName, value)
}

func (c *Collection) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(c, fieldName)
}

func (c *Collection) GetNamespace() string {
	return c.Namespace
}

func (c *Collection) SetNamespace(namespace string) {
	c.Namespace = namespace
}

func (c *Collection) SetWorkspace(workspace string) {
	c.Workspace = &Workspace{
		ID: workspace,
	}
}

func (c *Collection) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}

func (c *Collection) Len() int {
	return StandardItemLen(c)
}

func (c *Collection) GetItemMeta() *ItemMeta {
	return c.itemMeta
}

func (c *Collection) SetItemMeta(itemMeta *ItemMeta) {
	c.itemMeta = itemMeta
}

func (c *Collection) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, c.Name)
	if err != nil {
		return err
	}
	err = setDefaultValue(node, "dataSource", "uesio/core.platform")
	if err != nil {
		return err
	}
	err = setDefaultValue(node, "nameField", "uesio/core.id")
	if err != nil {
		return err
	}
	return node.Decode(c)
}

func (c *Collection) IsPublic() bool {
	return c.Public
}
