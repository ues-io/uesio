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
	Type            string            `yaml:"type,omitempty" json:"type"`
	Collection      string            `yaml:"collection,omitempty" json:"collection"`
	Token           string            `yaml:"token" json:"token"`
	UserAccessToken string            `yaml:"userAccessToken" json:"userAccessToken"`
	Access          string            `yaml:"access" json:"access"`
	Conditions      []*TokenCondition `yaml:"conditions,omitempty" json:"conditions"`
}

type TokenCondition struct {
	Field string      `yaml:"field" json:"field"`
	Value interface{} `yaml:"value" json:"value"`
}

type Collection struct {
	Type                  string                            `yaml:"type,omitempty" json:"uesio/studio.type"`
	Label                 string                            `yaml:"label" json:"uesio/studio.label"`
	PluralLabel           string                            `yaml:"pluralLabel" json:"uesio/studio.plurallabel"`
	DataSourceRef         string                            `yaml:"dataSource,omitempty" json:"uesio/studio.datasource"`
	UniqueKeyFields       []string                          `yaml:"uniqueKey,omitempty" json:"uesio/studio.uniquekey"`
	NameField             string                            `yaml:"nameField,omitempty" json:"uesio/studio.namefield"`
	ReadOnly              bool                              `yaml:"readOnly,omitempty" json:"-"`
	Access                string                            `yaml:"access,omitempty" json:"uesio/studio.access"`
	AccessField           string                            `yaml:"accessField,omitempty" json:"-"`
	RecordChallengeTokens []*RecordChallengeTokenDefinition `yaml:"recordChallengeTokens,omitempty" json:"uesio/studio.recordchallengetokens"`
	TableName             string                            `yaml:"tablename,omitempty" json:"uesio/studio.tablename"`
	BuiltIn               `yaml:",inline"`
	BundleableBase        `yaml:",inline"`
}

type CollectionWrapper Collection

func (c *Collection) GetCollectionName() string {
	return COLLECTION_COLLECTION_NAME
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
