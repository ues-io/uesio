package meta

import (
	"fmt"

	"gopkg.in/yaml.v3"
)

func NewUtility(key string) (*Utility, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, fmt.Errorf("bad key for utility: %s", key)
	}
	return NewBaseUtility(namespace, name), nil
}

func NewBaseUtility(namespace, name string) *Utility {
	return &Utility{BundleableBase: NewBase(namespace, name)}
}

type Utility struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Pack           string   `yaml:"pack,omitempty" json:"uesio/studio.pack"`
	EntryPoint     string   `yaml:"entrypoint,omitempty" json:"uesio/studio.entrypoint"`
	Utilities      []string `yaml:"utilities,omitempty" json:"uesio/studio.utilities"`
}

type UtilityWrapper Utility

func (u *Utility) GetCollection() CollectionableGroup {
	return &UtilityCollection{}
}

func (u *Utility) GetCollectionName() string {
	return UTILITY_COLLECTION_NAME
}

func (u *Utility) GetBundleFolderName() string {
	return UTILITY_FOLDER_NAME
}

func (u *Utility) SetField(fieldName string, value any) error {
	return StandardFieldSet(u, fieldName, value)
}

func (u *Utility) GetField(fieldName string) (any, error) {
	return StandardFieldGet(u, fieldName)
}

func (u *Utility) Loop(iter func(string, any) error) error {
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

func (u *Utility) IsPublic() bool {
	return true
}
