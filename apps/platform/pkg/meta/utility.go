package meta

import (
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
)

type Utility struct {
	ID        string     `yaml:"-" json:"uesio/core.id"`
	UniqueKey string     `yaml:"-" json:"uesio/core.uniquekey"`
	Name      string     `yaml:"name" json:"uesio/studio.name"`
	Namespace string     `yaml:"-" json:"-"`
	Workspace *Workspace `yaml:"-" json:"uesio/studio.workspace"`
	itemMeta  *ItemMeta  `yaml:"-" json:"-"`
	CreatedBy *User      `yaml:"-" json:"uesio/core.createdby"`
	Owner     *User      `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy *User      `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt int64      `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt int64      `yaml:"-" json:"uesio/core.createdat"`
	Public    bool       `yaml:"public,omitempty" json:"uesio/studio.public"`
}

type UtilityWrapper Utility

func (u *Utility) GetCollectionName() string {
	return u.GetBundleGroup().GetName()
}

func (u *Utility) GetCollection() CollectionableGroup {
	return &UtilityCollection{}
}

func (u *Utility) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, u.Name)
}

func (u *Utility) GetBundleGroup() BundleableGroup {
	return &UtilityCollection{}
}

func (u *Utility) GetKey() string {
	return fmt.Sprintf("%s.%s", u.Namespace, u.Name)
}

func (u *Utility) GetPath() string {
	return u.Name + ".yaml"
}

func (u *Utility) GetPermChecker() *PermissionSet {
	return nil
}

func (u *Utility) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(u, fieldName, value)
}

func (u *Utility) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(u, fieldName)
}

func (u *Utility) GetNamespace() string {
	return u.Namespace
}

func (u *Utility) SetNamespace(namespace string) {
	u.Namespace = namespace
}

func (u *Utility) SetModified(mod time.Time) {
	u.UpdatedAt = mod.UnixMilli()
}

func (u *Utility) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(u, iter)
}

func (u *Utility) Len() int {
	return StandardItemLen(u)
}

func (u *Utility) GetItemMeta() *ItemMeta {
	return u.itemMeta
}

func (u *Utility) SetItemMeta(itemMeta *ItemMeta) {
	u.itemMeta = itemMeta
}

func (u *Utility) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, u.Name)
	if err != nil {
		return err
	}
	return node.Decode((*UtilityWrapper)(u))
}

func (u *Utility) IsPublic() bool {
	return u.Public
}
