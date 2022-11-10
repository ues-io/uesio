package meta

import (
	"errors"
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
)

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
	Type  string `yaml:"type" json:"uesio/studio.type"`
	Value string `yaml:"value" json:"uesio/studio.value"`
}

type Credential struct {
	ID        string                     `yaml:"-" json:"uesio/core.id"`
	UniqueKey string                     `yaml:"-" json:"uesio/core.uniquekey"`
	Name      string                     `yaml:"name" json:"uesio/studio.name"`
	Namespace string                     `yaml:"-" json:"-"`
	Entries   map[string]CredentialEntry `yaml:"entries" json:"uesio/studio.entries"`
	Workspace *Workspace                 `yaml:"-" json:"uesio/studio.workspace"`
	itemMeta  *ItemMeta                  `yaml:"-" json:"-"`
	CreatedBy *User                      `yaml:"-" json:"uesio/core.createdby"`
	Owner     *User                      `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy *User                      `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt int64                      `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt int64                      `yaml:"-" json:"uesio/core.createdat"`
	Public    bool                       `yaml:"public,omitempty" json:"uesio/studio.public"`
}

type CredentialWrapper Credential

func (c *Credential) GetCollectionName() string {
	return c.GetBundleGroup().GetName()
}

func (c *Credential) GetCollection() CollectionableGroup {
	return &CredentialCollection{}
}

func (c *Credential) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, c.Name)
}

func (c *Credential) GetBundleGroup() BundleableGroup {
	return &CredentialCollection{}
}

func (c *Credential) GetKey() string {
	return fmt.Sprintf("%s.%s", c.Namespace, c.Name)
}

func (c *Credential) GetPath() string {
	return c.Name + ".yaml"
}

func (c *Credential) GetPermChecker() *PermissionSet {
	return nil
}

func (c *Credential) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(c, fieldName, value)
}

func (c *Credential) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(c, fieldName)
}

func (c *Credential) GetNamespace() string {
	return c.Namespace
}

func (c *Credential) SetNamespace(namespace string) {
	c.Namespace = namespace
}

func (c *Credential) SetModified(mod time.Time) {
	c.UpdatedAt = mod.UnixMilli()
}

func (c *Credential) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}

func (c *Credential) Len() int {
	return StandardItemLen(c)
}

func (c *Credential) GetItemMeta() *ItemMeta {
	return c.itemMeta
}

func (c *Credential) SetItemMeta(itemMeta *ItemMeta) {
	c.itemMeta = itemMeta
}

func (c *Credential) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, c.Name)
	if err != nil {
		return err
	}
	return node.Decode((*CredentialWrapper)(c))
}
func (c *Credential) IsPublic() bool {
	return c.Public
}
