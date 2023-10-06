package meta

import (
	"errors"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type FeatureFlag struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Value          interface{}
	DefaultValue   interface{} `yaml:"defaultValue" json:"uesio/studio.defaultvalue"`
	Min            int64       `yaml:"min" json:"uesio/studio.min"`
	Max            int64       `yaml:"max" json:"uesio/studio.max"`
	Type           string      `yaml:"type" json:"uesio/studio.type"`
	ValidForOrgs   bool        `yaml:"validForOrgs" json:"uesio/studio.validfororgs"`
	User           string
}

type FeatureFlagWrapper FeatureFlag

func (ff *FeatureFlag) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(ff)
}

func (ff *FeatureFlag) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("namespace", ff.Namespace)
	enc.AddStringKey("name", ff.Name)
	enc.AddStringKey("user", ff.User)
	enc.AddStringKey("type", ff.Type)
	if ff.ValidForOrgs {
		enc.AddBoolKey("validForOrgs", true)
	}
	if ff.Type == "NUMBER" {
		useIntValue := int64(0)
		intDefaultValue, hasDefault := ff.DefaultValue.(int)
		if intValue, hasValue := ff.Value.(float64); hasValue {
			useIntValue = int64(intValue)
		} else if hasDefault {
			useIntValue = int64(intDefaultValue)
		}
		enc.AddInt64Key("value", useIntValue)
		// Ignore min / max if both 0, that means they weren't set
		if ff.Min != 0 || ff.Max != 0 {
			enc.AddInt64Key("min", ff.Min)
			enc.AddInt64Key("max", ff.Max)
		}
	} else {
		useBoolValue := false
		boolDefaultValue, hasDefault := ff.DefaultValue.(bool)
		if boolValue, hasValue := ff.Value.(bool); hasValue {
			useBoolValue = boolValue
		} else if hasDefault {
			useBoolValue = boolDefaultValue
		}
		enc.AddBoolKey("value", useBoolValue)
	}
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
