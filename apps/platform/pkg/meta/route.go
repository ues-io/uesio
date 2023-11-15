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
	return NewBaseRoute(namespace, name), nil
}

func NewBaseRoute(namespace, name string) *Route {
	return &Route{BundleableBase: NewBase(namespace, name)}
}

type Tag struct {
	Type     string `yaml:"type" json:"type"`
	Location string `yaml:"location" json:"location"`
	Name     string `yaml:"name" json:"name"`
	Content  string `yaml:"content" json:"content"`
}

type Route struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Type           string            `yaml:"type,omitempty" json:"uesio/studio.type"`
	Path           string            `yaml:"path,omitempty" json:"uesio/studio.path"`
	ViewRef        string            `yaml:"view,omitempty" json:"uesio/studio.view"`
	Redirect       string            `yaml:"redirect,omitempty" json:"uesio/studio.redirect"`
	Params         map[string]string `yaml:"params,omitempty" json:"uesio/studio.params"`
	ThemeRef       string            `yaml:"theme,omitempty" json:"uesio/studio.theme"`
	Title          string            `yaml:"title,omitempty" json:"uesio/studio.title"`
	Tags           []Tag             `yaml:"tags,omitempty" json:"uesio/studio.tags"`
}

type RouteWrapper Route

func (r *Route) GetCollection() CollectionableGroup {
	return &RouteCollection{}
}

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
	routeType := GetNodeValueAsString(node, "type")
	if routeType == "redirect" {
		if redirectTo := GetNodeValueAsString(node, "redirect"); redirectTo == "" {
			return errors.New("redirect property is required for routes of type 'redirect'")
		}
	} else {

		r.ViewRef, err = pickRequiredMetadataItem(node, "view", r.Namespace)
		if err != nil {
			return fmt.Errorf("invalid route %s: %s", r.GetKey(), err.Error())
		}

	}
	return node.Decode((*RouteWrapper)(r))
}

func (r *Route) MarshalYAML() (interface{}, error) {

	r.ViewRef = GetLocalizedKey(r.ViewRef, r.Namespace)

	return (*RouteWrapper)(r), nil
}
