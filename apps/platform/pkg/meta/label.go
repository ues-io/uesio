package meta

import (
	"errors"
	"fmt"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type Label struct {
	Name  string `yaml:"name" json:"uesio/studio.name"`
	Value string `yaml:"value" json:"uesio/studio.value"`
	BuiltIn
	BundleableBase `yaml:",inline"`
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
		return nil, errors.New("Bad Key for Label: " + key)
	}
	return &Label{
		Name: name,
		BundleableBase: BundleableBase{
			Namespace: namespace,
		},
	}, nil
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

func (l *Label) GetCollectionName() string {
	return LABEL_COLLECTION_NAME
}

func (l *Label) GetBundleFolderName() string {
	return LABEL_FOLDER_NAME
}

func (l *Label) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, l.Name)
}

func (l *Label) GetKey() string {
	return fmt.Sprintf("%s.%s", l.Namespace, l.Name)
}

func (l *Label) GetPath() string {
	return l.Name + ".yaml"
}

func (l *Label) GetPermChecker() *PermissionSet {
	return nil
}

func (l *Label) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(l, fieldName, value)
}

func (l *Label) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(l, fieldName)
}

func (l *Label) Loop(iter func(string, interface{}) error) error {
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
