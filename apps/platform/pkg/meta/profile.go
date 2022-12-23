package meta

import (
	"errors"
	"fmt"

	"gopkg.in/yaml.v3"
)

func NewProfile(key string) (*Profile, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Profile")
	}
	return &Profile{
		Name: name,
		BundleableBase: BundleableBase{
			Namespace: namespace,
		},
	}, nil
}

type Profile struct {
	Name              string          `yaml:"name" json:"uesio/studio.name"`
	PermissionSetRefs []string        `yaml:"permissionSets" json:"uesio/studio.permissionsetsrefs"`
	PermissionSets    []PermissionSet `yaml:"-" json:"-"`
	BuiltIn
	BundleableBase `yaml:",inline"`
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

func (p *Profile) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(p, iter)
}

func (p *Profile) Len() int {
	return StandardItemLen(p)
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
