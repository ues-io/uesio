package meta

import (
	"gopkg.in/yaml.v3"
)

func NewBaseUtility(namespace, name string) *Utility {
	return &Utility{BundleableBase: NewBase(namespace, name)}
}

type Utility struct {
	BuiltIn
	BundleableBase `yaml:",inline"`
}

type UtilityWrapper Utility

func (u *Utility) GetCollectionName() string {
	return UTILITY_COLLECTION_NAME
}

func (u *Utility) GetBundleFolderName() string {
	return UTILITY_FOLDER_NAME
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
