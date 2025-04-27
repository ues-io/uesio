package meta

import (
	"fmt"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type FeatureFlag struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Value          any    `yaml:"-" json:"-"`
	DefaultValue   any    `yaml:"defaultValue" json:"uesio/studio.defaultvalue"`
	Min            int64  `yaml:"min" json:"uesio/studio.min"`
	Max            int64  `yaml:"max" json:"uesio/studio.max"`
	Type           string `yaml:"type" json:"uesio/studio.type"`
	ValidForOrgs   bool   `yaml:"validForOrgs" json:"uesio/studio.validfororgs"`
	User           string `yaml:"-" json:"-"`
	HasValue       bool   `yaml:"-" json:"-"`
}

type FeatureFlagWrapper FeatureFlag

func (ff *FeatureFlag) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(ff)
}

func (ff *FeatureFlag) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("namespace", ff.Namespace)
	enc.AddStringKey("name", ff.Name)
	enc.AddStringKeyOmitEmpty("user", ff.User)
	enc.AddStringKey("type", ff.Type)
	enc.AddInterfaceKeyOmitEmpty("value", ff.Value)
	enc.AddBoolKeyOmitEmpty("validForOrgs", ff.ValidForOrgs)
}

func (ff *FeatureFlag) IsNil() bool {
	return ff == nil
}

func NewFeatureFlag(key string) (*FeatureFlag, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, fmt.Errorf("bad key for feature flag: %s", key)
	}
	return NewBaseFeatureFlag(namespace, name), nil
}

func NewBaseFeatureFlag(namespace, name string) *FeatureFlag {
	return &FeatureFlag{BundleableBase: NewBase(namespace, name)}
}

func (ff *FeatureFlag) GetCollection() CollectionableGroup {
	return &FeatureFlagCollection{}
}

func (ff *FeatureFlag) GetCollectionName() string {
	return FEATUREFLAG_COLLECTION_NAME
}

func (ff *FeatureFlag) GetBundleFolderName() string {
	return FEATUREFLAG_FOLDER_NAME
}

func (ff *FeatureFlag) SetField(fieldName string, value any) error {
	return StandardFieldSet(ff, fieldName, value)
}

func (ff *FeatureFlag) GetField(fieldName string) (any, error) {
	return StandardFieldGet(ff, fieldName)
}

func (ff *FeatureFlag) Loop(iter func(string, any) error) error {
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
