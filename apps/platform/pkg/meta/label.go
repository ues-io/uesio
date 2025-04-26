package meta

import (
	"fmt"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type Label struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Value          string `yaml:"value" json:"uesio/studio.value"`
}

type LabelWrapper Label

func (l *Label) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(l)
}

func (l *Label) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("namespace", l.Namespace)
	enc.AddStringKey("name", l.Name)
	enc.AddStringKey("value", l.Value)
}

func (l *Label) IsNil() bool {
	return l == nil
}

func NewLabel(key string) (*Label, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, fmt.Errorf("bad key for label: %s", key)
	}
	return NewBaseLabel(namespace, name), nil
}

func NewBaseLabel(namespace, name string) *Label {
	return &Label{BundleableBase: NewBase(namespace, name)}
}

func NewLabels(keys map[string]bool) ([]BundleableItem, error) {
	items := []BundleableItem{}

	for key := range keys {
		newLabel, err := NewLabel(key)
		if err != nil {
			return nil, err
		}
		items = append(items, newLabel)
	}

	return items, nil
}

func (l *Label) GetCollection() CollectionableGroup {
	return &LabelCollection{}
}

func (l *Label) GetCollectionName() string {
	return LABEL_COLLECTION_NAME
}

func (l *Label) GetBundleFolderName() string {
	return LABEL_FOLDER_NAME
}

func (l *Label) SetField(fieldName string, value any) error {
	return StandardFieldSet(l, fieldName, value)
}

func (l *Label) GetField(fieldName string) (any, error) {
	return StandardFieldGet(l, fieldName)
}

func (l *Label) Loop(iter func(string, any) error) error {
	return StandardItemLoop(l, iter)
}

func (l *Label) Len() int {
	return StandardItemLen(l)
}

func (l *Label) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, l.Name)
	if err != nil {
		return err
	}
	return node.Decode((*LabelWrapper)(l))
}
