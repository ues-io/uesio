package meta

import (
	"fmt"

	"gopkg.in/yaml.v3"
)

type Utility struct {
	Name string `yaml:"name" json:"uesio/studio.name"`
	BuiltIn
	BundleableBase `yaml:",inline"`
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

func (u *Utility) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(u, iter)
}

func (u *Utility) Len() int {
	return StandardItemLen(u)
}

func (u *Utility) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, u.Name)
	if err != nil {
		return err
	}
	return node.Decode((*UtilityWrapper)(u))
}
