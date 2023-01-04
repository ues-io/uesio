package meta

import (
	"errors"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type FeatureFlag struct {
	Value          bool
	User           string
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
}

type FeatureFlagWrapper FeatureFlag

func (ff *FeatureFlag) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(ff)
}

func (ff *FeatureFlag) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("namespace", ff.Namespace)
	enc.AddStringKey("name", ff.Name)
	enc.AddBoolKey("value", ff.Value)
	enc.AddStringKey("user", ff.User)
}

func (ff *FeatureFlag) IsNil() bool {
	return ff == nil
}

func NewFeatureFlag(key string) (*FeatureFlag, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for FeatureFlag: " + key)
	}
	return NewBaseFeatureFlag(namespace, name), nil
}

func NewBaseFeatureFlag(namespace, name string) *FeatureFlag {
	return &FeatureFlag{BundleableBase: NewBase(namespace, name)}
}

func (ff *FeatureFlag) GetCollectionName() string {
	return FEATUREFLAG_COLLECTION_NAME
}

func (ff *FeatureFlag) GetBundleFolderName() string {
	return FEATUREFLAG_FOLDER_NAME
}

func (ff *FeatureFlag) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ff, fieldName, value)
}

func (ff *FeatureFlag) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ff, fieldName)
}

func (ff *FeatureFlag) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ff, iter)
}

func (ff *FeatureFlag) Len() int {
	return StandardItemLen(ff)
}

func (ff *FeatureFlag) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, ff.Name)
	if err != nil {
		return err
	}
	return node.Decode((*FeatureFlagWrapper)(ff))
}
