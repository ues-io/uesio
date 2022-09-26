package meta

import (
	"errors"
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
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
	Type            string            `yaml:"type,omitempty" uesio:"type" json:"type"`
	Collection      string            `yaml:"collection,omitempty" uesio:"collection" json:"collection"`
	Token           string            `yaml:"token" uesio:"token" json:"token"`
	UserAccessToken string            `yaml:"userAccessToken" uesio:"userAccessToken" json:"userAccessToken"`
	Access          string            `yaml:"access" uesio:"access" json:"access"`
	Conditions      []*TokenCondition `yaml:"conditions,omitempty" uesio:"conditions" json:"conditions"`
}

type TokenCondition struct {
	Field string `yaml:"field" uesio:"field" json:"field"`
	Value string `yaml:"value" uesio:"value" json:"value"`
}

type Collection struct {
	ID                    string                            `yaml:"-" uesio:"uesio/core.id"`
	UniqueKey             string                            `yaml:"-" uesio:"uesio/core.uniquekey"`
	Type                  string                            `yaml:"type,omitempty" uesio:"uesio/studio.type"`
	Name                  string                            `yaml:"name" uesio:"uesio/studio.name"`
	Label                 string                            `yaml:"label" uesio:"uesio/studio.label"`
	PluralLabel           string                            `yaml:"pluralLabel" uesio:"uesio/studio.plurallabel"`
	Namespace             string                            `yaml:"-" uesio:"-"`
	DataSourceRef         string                            `yaml:"dataSource,omitempty" uesio:"uesio/studio.datasource"`
	UniqueKeyFields       []string                          `yaml:"uniqueKey,omitempty" uesio:"uesio/studio.uniquekey"`
	NameField             string                            `yaml:"nameField,omitempty" uesio:"uesio/studio.namefield"`
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
	RecordChallengeTokens []*RecordChallengeTokenDefinition `yaml:"recordChallengeTokens,omitempty" uesio:"uesio/studio.recordchallengetokens"`
	TableName             string                            `yaml:"tablename,omitempty" uesio:"uesio/studio.tablename"`
	Public                bool                              `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

type CollectionWrapper Collection

func (c *Collection) GetCollectionName() string {
	return c.GetBundleGroup().GetName()
}

func (c *Collection) GetCollection() CollectionableGroup {
	var cc CollectionCollection
	return &cc
}

func (c *Collection) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, c.Name)
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

func (c *Collection) SetModified(mod time.Time) {
	c.UpdatedAt = mod.UnixMilli()
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

	return node.Decode((*CollectionWrapper)(c))
}

func (c *Collection) MarshalYAML() (interface{}, error) {

	if c.DataSourceRef == "uesio/core.platform" {
		c.DataSourceRef = ""
	}

	if c.NameField == "uesio/core.id" {
		c.NameField = ""
	}

	return (*CollectionWrapper)(c), nil
}

func (c *Collection) IsPublic() bool {
	return c.Public
}
