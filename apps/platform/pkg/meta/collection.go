package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

func NewCollection(key string) (*Collection, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Collection: " + key)
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
	Field string      `yaml:"field" json:"field"`
	Value interface{} `yaml:"value" json:"value"`
}

type Collection struct {
	BuiltIn         `yaml:",inline"`
	BundleableBase  `yaml:",inline"`
	Type            string   `yaml:"type,omitempty" json:"uesio/studio.type"`
	Label           string   `yaml:"label,omitempty" json:"uesio/studio.label"`
	PluralLabel     string   `yaml:"pluralLabel,omitempty" json:"uesio/studio.plurallabel"`
	UniqueKeyFields []string `yaml:"uniqueKey,omitempty" json:"uesio/studio.uniquekey"`
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

func (c *Collection) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(c, fieldName, value)
}

func (c *Collection) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(c, fieldName)
}

func (c *Collection) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}

func (c *Collection) Len() int {
	return StandardItemLen(c)
}

func (c *Collection) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, c.Name)
	if err != nil {
		return err
	}
	c.IntegrationRef = pickMetadataItem(node, "integration", c.Namespace, "")
	c.NameField = pickMetadataItem(node, "nameField", c.Namespace, "uesio/core.id")
	c.LoadBot = pickMetadataItem(node, "loadBot", c.Namespace, "")
	c.SaveBot = pickMetadataItem(node, "saveBot", c.Namespace, "")
	return node.Decode((*CollectionWrapper)(c))
}

func (c *Collection) MarshalYAML() (interface{}, error) {
	c.IntegrationRef = removeDefault(GetLocalizedKey(c.IntegrationRef, c.Namespace), PLATFORM_DATA_SOURCE)
	c.NameField = removeDefault(GetLocalizedKey(c.NameField, c.Namespace), "uesio/core.id")
	c.LoadBot = GetLocalizedKey(c.LoadBot, c.Namespace)
	c.SaveBot = GetLocalizedKey(c.SaveBot, c.Namespace)
	return (*CollectionWrapper)(c), nil
}
