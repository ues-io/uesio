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
	return &Route{ThemeRef: "uesio/core.default", BundleableBase: NewBase(namespace, name)}
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
	Path           string            `yaml:"path" json:"uesio/studio.path"`
	ViewRef        string            `yaml:"view" json:"uesio/studio.view"`
	Redirect       string            `yaml:"redirect" json:"uesio/studio.redirect"`
	Params         map[string]string `yaml:"params,omitempty" json:"uesio/studio.params"`
	ThemeRef       string            `yaml:"theme" json:"uesio/studio.theme"`
	Type           string            `yaml:"type" json:"uesio/studio.type"`
	Title          string            `yaml:"title" json:"uesio/studio.title"`
	Tags           []Tag             `yaml:"tags,omitempty" json:"uesio/studio.tags"`
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
	routeType := GetNodeValueAsString(node, "type")
	if routeType == "redirect" {
		if redirectTo := GetNodeValueAsString(node, "redirect"); redirectTo == "" {
			return errors.New("redirect property is required for routes of type 'redirect'")
		}
	} else {
		r.ViewRef = pickMetadataItem(node, "view", r.Namespace, "")
		if r.ViewRef == "" {
			return fmt.Errorf("a view property is required on route %s", r.GetKey())
		}
		r.ThemeRef = pickMetadataItem(node, "theme", r.Namespace, "uesio/core.default")
		if r.ThemeRef == "" {
			return fmt.Errorf("a theme property is required on route %s", r.GetKey())
		}
	}
	return node.Decode((*RouteWrapper)(r))
}

func (r *Route) MarshalYAML() (interface{}, error) {

	if r.ThemeRef == "uesio/core.default" {
		r.ThemeRef = ""
	}

	r.ThemeRef = localizeShort(r.ThemeRef, r.Namespace)
	r.ViewRef = localizeShort(r.ViewRef, r.Namespace)

	return (*RouteWrapper)(r), nil
}
