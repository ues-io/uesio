package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

func NewRoute(key string) (*Route, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Invalid Route Key: " + key)
	}
	return NewBaseRoute(namespace, name), nil
}

func NewBaseRoute(namespace, name string) *Route {
	return &Route{BundleableBase: NewBase(namespace, name)}
}

type Route struct {
	Path           string            `yaml:"path" json:"uesio/studio.path"`
	ViewType       string            `yaml:"viewtype,omitempty" json:"uesio/studio.viewtype"`
	ViewRef        string            `yaml:"view" json:"uesio/studio.view"`
	Collection     string            `yaml:"collection,omitempty" json:"uesio/studio.collection"`
	Params         map[string]string `yaml:"params,omitempty" json:"uesio/studio.params"`
	ThemeRef       string            `yaml:"theme" json:"uesio/studio.theme"`
	Title          string            `yaml:"title" json:"uesio/studio.title"`
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
}

type RouteWrapper Route

func (r *Route) GetCollectionName() string {
	return ROUTE_COLLECTION_NAME
}

func (r *Route) GetBundleFolderName() string {
	return ROUTE_FOLDER_NAME
}

func (r *Route) GetPermChecker() *PermissionSet {
	key := r.GetKey()
	return &PermissionSet{
		RouteRefs: map[string]bool{
			key: true,
		},
	}
}

func (r *Route) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(r, fieldName, value)
}

func (r *Route) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(r, fieldName)
}

func (r *Route) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(r, iter)
}

func (r *Route) Len() int {
	return StandardItemLen(r)
}

func (r *Route) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, r.Name)
	if err != nil {
		return err
	}
	err = validateRequiredMetadataItem(node, "view")
	if err != nil {
		return err
	}
	err = setDefaultValue(node, "theme", "uesio/core.default")
	if err != nil {
		return err
	}
	err = validateRequiredMetadataItem(node, "theme")
	if err != nil {
		return err
	}
	return node.Decode((*RouteWrapper)(r))
}
