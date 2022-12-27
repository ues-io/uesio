package meta

import (
	"errors"
	"fmt"

	"gopkg.in/yaml.v3"
)

func NewRoute(key string) (*Route, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Invalid Route Key: " + key)
	}
	return &Route{
		BundleableBase: BundleableBase{
			Namespace: namespace,
		},
		Name: name,
	}, nil
}

type Route struct {
	Name       string            `yaml:"name" json:"uesio/studio.name"`
	Path       string            `yaml:"path" json:"uesio/studio.path"`
	ViewType   string            `yaml:"viewtype,omitempty" json:"uesio/studio.viewtype"`
	ViewRef    string            `yaml:"view" json:"uesio/studio.view"`
	Collection string            `yaml:"collection,omitempty" json:"uesio/studio.collection"`
	Params     map[string]string `yaml:"params,omitempty" json:"uesio/studio.params"`
	ThemeRef   string            `yaml:"theme" json:"uesio/studio.theme"`
	BuiltIn
	BundleableBase `yaml:",inline"`
}

type RouteWrapper Route

func (r *Route) GetCollectionName() string {
	return ROUTE_COLLECTION_NAME
}

func (r *Route) GetBundleFolderName() string {
	return ROUTE_FOLDER_NAME
}

func (r *Route) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, r.Name)
}

func (r *Route) GetKey() string {
	return fmt.Sprintf("%s.%s", r.Namespace, r.Name)
}

func (r *Route) GetPath() string {
	return r.Name + ".yaml"
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
