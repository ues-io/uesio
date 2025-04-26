package meta

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"gopkg.in/yaml.v3"
)

func NewCollection(key string) (*Collection, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, fmt.Errorf("bad key for collection: %s", key)
	}
	return NewBaseCollection(namespace, name), nil
}

func NewBaseCollection(namespace, name string) *Collection {
	return &Collection{BundleableBase: NewBase(namespace, name)}
}

func NewCollections(keys map[string]bool) ([]BundleableItem, error) {
	var items []BundleableItem
	for key := range keys {
		if newCollection, err := NewCollection(key); err != nil {
			return nil, err
		} else {
			items = append(items, newCollection)
		}
	}
	return items, nil
}

type TokenCondition struct {
	Field string `yaml:"field" json:"field"`
	Value any    `yaml:"value" json:"value"`
}

type Collection struct {
	BuiltIn         `yaml:",inline"`
	BundleableBase  `yaml:",inline"`
	Type            string   `yaml:"type,omitempty" json:"uesio/studio.type"`
	Icon            string   `yaml:"icon,omitempty" json:"uesio/studio.icon"`
	PluralLabel     string   `yaml:"pluralLabel,omitempty" json:"uesio/studio.plurallabel"`
	UniqueKeyFields []string `yaml:"uniqueKey,omitempty" json:"uesio/studio.uniquekey"`
	IdField         string   `yaml:"idField,omitempty" json:"uesio/studio.idfield"`
	NameField       string   `yaml:"nameField,omitempty" json:"uesio/studio.namefield"`
	ReadOnly        bool     `yaml:"readOnly,omitempty" json:"-"`
	Access          string   `yaml:"access,omitempty" json:"uesio/studio.access"`
	AccessField     string   `yaml:"accessField,omitempty" json:"uesio/studio.accessfield"`
	TableName       string   `yaml:"tablename,omitempty" json:"uesio/studio.tablename"`
	IntegrationRef  string   `yaml:"integration,omitempty" json:"uesio/studio.integration"`
	LoadBot         string   `yaml:"loadBot,omitempty" json:"uesio/studio.loadbot"`
	SaveBot         string   `yaml:"saveBot,omitempty" json:"uesio/studio.savebot"`
}

type CollectionWrapper Collection

func (c *Collection) GetCollectionName() string {
	return COLLECTION_COLLECTION_NAME
}

func (c *Collection) GetCollection() CollectionableGroup {
	return &CollectionCollection{}
}

func (c *Collection) GetBundleFolderName() string {
	return COLLECTION_FOLDER_NAME
}

func (c *Collection) GetPermChecker() *PermissionSet {
	key := c.GetKey()
	collectionRefs := map[string]CollectionPermission{key: {}}
	return &PermissionSet{
		CollectionRefs: collectionRefs,
	}
}

func (c *Collection) SetField(fieldName string, value any) error {
	return StandardFieldSet(c, fieldName, value)
}

func (c *Collection) GetField(fieldName string) (any, error) {
	return StandardFieldGet(c, fieldName)
}

func (c *Collection) Loop(iter func(string, any) error) error {
	return StandardItemLoop(c, iter)
}

func (c *Collection) Len() int {
	return StandardItemLen(c)
}

func (c *Collection) UnmarshalYAML(node *yaml.Node) error {
	// Do this BEFORE unmarshalling to ensure that the file path name matches the YAML name property
	if err := validateNodeName(node, c.Name); err != nil {
		return err
	}
	if err := node.Decode((*CollectionWrapper)(c)); err != nil {
		return err
	}
	c.IntegrationRef = GetFullyQualifiedKey(c.IntegrationRef, c.Namespace)
	c.NameField = GetFullyQualifiedKey(c.NameField, c.Namespace)
	if c.NameField == "" {
		c.NameField = commonfields.Id
	}
	c.IdField = GetFullyQualifiedKey(c.IdField, c.Namespace)
	if c.IdField == "" {
		c.IdField = commonfields.Id
	}
	c.LoadBot = GetFullyQualifiedKey(c.LoadBot, c.Namespace)
	c.SaveBot = GetFullyQualifiedKey(c.SaveBot, c.Namespace)
	if len(c.UniqueKeyFields) > 0 {
		for i := range c.UniqueKeyFields {
			c.UniqueKeyFields[i] = GetFullyQualifiedKey(c.UniqueKeyFields[i], c.Namespace)
		}
	}
	return nil
}

func (c *Collection) MarshalYAML() (any, error) {
	c.IntegrationRef = removeDefault(GetLocalizedKey(c.IntegrationRef, c.Namespace), PLATFORM_DATA_SOURCE)
	c.NameField = removeDefault(GetLocalizedKey(c.NameField, c.Namespace), commonfields.Id)
	c.IdField = removeDefault(GetLocalizedKey(c.IdField, c.Namespace), commonfields.Id)
	c.LoadBot = GetLocalizedKey(c.LoadBot, c.Namespace)
	c.SaveBot = GetLocalizedKey(c.SaveBot, c.Namespace)
	if len(c.UniqueKeyFields) > 0 {
		for i := range c.UniqueKeyFields {
			c.UniqueKeyFields[i] = GetLocalizedKey(c.UniqueKeyFields[i], c.Namespace)
		}
	}
	return (*CollectionWrapper)(c), nil
}
