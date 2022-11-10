package meta

import (
	"errors"
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
)

func NewProfile(key string) (*Profile, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Profile")
	}
	return &Profile{
		Name:      name,
		Namespace: namespace,
	}, nil
}

type Profile struct {
	ID                string          `yaml:"-" json:"uesio/core.id"`
	UniqueKey         string          `yaml:"-" json:"uesio/core.uniquekey"`
	Name              string          `yaml:"name" json:"uesio/studio.name"`
	Namespace         string          `yaml:"-" json:"-"`
	PermissionSetRefs []string        `yaml:"permissionSets" json:"uesio/studio.permissionsetsrefs"`
	PermissionSets    []PermissionSet `yaml:"-" json:"-"`
	Workspace         *Workspace      `yaml:"-" json:"uesio/studio.workspace"`
	itemMeta          *ItemMeta       `yaml:"-" json:"-"`
	CreatedBy         *User           `yaml:"-" json:"uesio/core.createdby"`
	Owner             *User           `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy         *User           `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt         int64           `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt         int64           `yaml:"-" json:"uesio/core.createdat"`
	Public            bool            `yaml:"public,omitempty" json:"uesio/studio.public"`
}

type ProfileWrapper Profile

func (p *Profile) GetCollectionName() string {
	return p.GetBundleGroup().GetName()
}

func (p *Profile) GetCollection() CollectionableGroup {
	return &ProfileCollection{}
}

func (p *Profile) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, p.Name)
}

func (p *Profile) GetBundleGroup() BundleableGroup {
	return &ProfileCollection{}
}

func (p *Profile) GetKey() string {
	return fmt.Sprintf("%s.%s", p.Namespace, p.Name)
}

func (p *Profile) GetPath() string {
	return p.Name + ".yaml"
}

func (p *Profile) GetPermChecker() *PermissionSet {
	return nil
}

func (p *Profile) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(p, fieldName, value)
}

func (p *Profile) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(p, fieldName)
}

func (p *Profile) GetNamespace() string {
	return p.Namespace
}

func (p *Profile) SetNamespace(namespace string) {
	p.Namespace = namespace
}

func (p *Profile) SetModified(mod time.Time) {
	p.UpdatedAt = mod.UnixMilli()
}

func (p *Profile) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(p, iter)
}

func (p *Profile) Len() int {
	return StandardItemLen(p)
}

func (p *Profile) GetItemMeta() *ItemMeta {
	return p.itemMeta
}

func (p *Profile) SetItemMeta(itemMeta *ItemMeta) {
	p.itemMeta = itemMeta
}

func (p *Profile) HasPermission(check *PermissionSet) bool {
	return p.FlattenPermissions().HasPermission(check)
}

// FlattenPermissions returns an inclusive permissionset
// of all permissions for that profile
func (p *Profile) FlattenPermissions() *PermissionSet {
	return FlattenPermissions(p.PermissionSets)
}

func (p *Profile) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, p.Name)
	if err != nil {
		return err
	}
	return node.Decode((*ProfileWrapper)(p))
}

func (p *Profile) IsPublic() bool {
	return p.Public
}
