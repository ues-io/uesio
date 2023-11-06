package meta

import (
	"errors"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type View struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Definition     *YAMLDef `yaml:"definition" json:"uesio/studio.definition"`
}

type ViewWrapper View

func (v *View) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(v)
}

func (v *View) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddObjectKey("definition", (*YAMLtoJSONMap)(v.Definition))
	enc.AddStringKey("namespace", v.Namespace)
	enc.AddStringKey("name", v.Name)
}

func (v *View) IsNil() bool {
	return v == nil
}

func NewView(key string) (*View, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for View: " + key)
	}
	return NewBaseView(namespace, name), nil
}

func NewBaseView(namespace, name string) *View {
	return &View{BundleableBase: NewBase(namespace, name)}
}

func NewViews(keys map[string]bool) ([]BundleableItem, error) {
	items := []BundleableItem{}

	for key := range keys {
		newView, err := NewView(key)
		if err != nil {
			return nil, err
		}
		items = append(items, newView)
	}

	return items, nil
}

func (v *View) GetCollection() CollectionableGroup {
	return &ViewCollection{}
}

func (v *View) GetCollectionName() string {
	return VIEW_COLLECTION_NAME
}

func (v *View) GetBundleFolderName() string {
	return VIEW_FOLDER_NAME
}

func (v *View) GetPermChecker() *PermissionSet {
	key := v.GetKey()
	return &PermissionSet{
		ViewRefs: map[string]bool{
			key: true,
		},
	}
}

func (v *View) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(v, fieldName, value)
}

func (v *View) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(v, fieldName)
}

func (v *View) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(v, iter)
}

func (v *View) Len() int {
	return StandardItemLen(v)
}

func (v *View) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, v.Name)
	if err != nil {
		return err
	}
	return node.Decode((*ViewWrapper)(v))
}
