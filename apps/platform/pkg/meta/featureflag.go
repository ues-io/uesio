package meta

import (
	"errors"
	"fmt"
	"time"

	"github.com/francoispqt/gojay"
	"github.com/humandad/yaml"
)

type FeatureFlag struct {
	ID        string     `yaml:"-" uesio:"uesio/core.id"`
	UniqueKey string     `yaml:"-" uesio:"uesio/core.uniquekey"`
	Name      string     `yaml:"name" uesio:"uesio/studio.name"`
	Namespace string     `yaml:"-" uesio:"-"`
	Workspace *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	itemMeta  *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64      `yaml:"-" uesio:"uesio/core.createdat"`
	Public    bool       `yaml:"public,omitempty" uesio:"uesio/studio.public"`
	Value     bool
	User      string
}

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
	return &FeatureFlag{
		Name:      name,
		Namespace: namespace,
	}, nil
}

func (ff *FeatureFlag) GetCollectionName() string {
	return ff.GetBundleGroup().GetName()
}

func (ff *FeatureFlag) GetCollection() CollectionableGroup {
	var ffc FeatureFlagCollection
	return &ffc
}

func (ff *FeatureFlag) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, ff.Name)
}

func (ff *FeatureFlag) GetBundleGroup() BundleableGroup {
	var ffc FeatureFlagCollection
	return &ffc
}

func (ff *FeatureFlag) GetKey() string {
	return fmt.Sprintf("%s.%s", ff.Namespace, ff.Name)
}

func (ff *FeatureFlag) GetPath() string {
	return ff.Name + ".yaml"
}

func (ff *FeatureFlag) GetPermChecker() *PermissionSet {
	return nil
}

func (ff *FeatureFlag) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ff, fieldName, value)
}

func (ff *FeatureFlag) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ff, fieldName)
}

func (ff *FeatureFlag) GetNamespace() string {
	return ff.Namespace
}

func (ff *FeatureFlag) SetNamespace(namespace string) {
	ff.Namespace = namespace
}

func (ff *FeatureFlag) SetModified(mod time.Time) {
	ff.UpdatedAt = mod.UnixMilli()
}

func (ff *FeatureFlag) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ff, iter)
}

func (ff *FeatureFlag) Len() int {
	return StandardItemLen(ff)
}

func (ff *FeatureFlag) GetItemMeta() *ItemMeta {
	return ff.itemMeta
}

func (ff *FeatureFlag) SetItemMeta(itemMeta *ItemMeta) {
	ff.itemMeta = itemMeta
}

func (ff *FeatureFlag) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, ff.Name)
	if err != nil {
		return err
	}
	return node.Decode(ff)
}

func (ff *FeatureFlag) IsPublic() bool {
	return ff.Public
}
