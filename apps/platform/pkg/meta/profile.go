package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

func NewProfile(key string) (*Profile, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Profile: " + key)
	}
	return NewBaseProfile(namespace, name), nil
}

func NewBaseProfile(namespace, name string) *Profile {
	return &Profile{
		BundleableBase: NewBase(namespace, name),
	}
}

type Profile struct {
	BuiltIn           `yaml:",inline"`
	BundleableBase    `yaml:",inline"`
	PermissionSetRefs []string        `yaml:"permissionSets" json:"uesio/studio.permissionsetsrefs"`
	PermissionSets    []PermissionSet `yaml:"-" json:"-"`
	HomeRoute         string          `yaml:"homeRoute,omitempty" json:"uesio/studio.homeroute"`
}

type ProfileWrapper Profile

func (p *Profile) GetCollection() CollectionableGroup {
	return &ProfileCollection{}
}

func (p *Profile) GetCollectionName() string {
	return PROFILE_COLLECTION_NAME
}

func (p *Profile) GetBundleFolderName() string {
	return PROFILE_FOLDER_NAME
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
