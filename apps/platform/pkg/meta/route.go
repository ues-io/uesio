package meta

import (
	"errors"
	"fmt"
	"maps"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/types/bots"
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
	Type           string         `yaml:"type,omitempty" json:"uesio/studio.type"`
	Path           string         `yaml:"path,omitempty" json:"uesio/studio.path"`
	ViewRef        string         `yaml:"view,omitempty" json:"uesio/studio.view"`
	BotRef         string         `yaml:"bot,omitempty" json:"uesio/studio.bot"`
	Redirect       string         `yaml:"redirect,omitempty" json:"uesio/studio.redirect"`
	Params         map[string]any `yaml:"params,omitempty" json:"uesio/studio.params"`
	ThemeRef       string         `yaml:"theme,omitempty" json:"uesio/studio.theme"`
	Title          string         `yaml:"title,omitempty" json:"uesio/studio.title"`
	Tags           []Tag          `yaml:"tags,omitempty" json:"uesio/studio.tags"`

	// Only used by Route Bots to attach additional context to the Route
	response *bots.RouteResponse
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

func (r *Route) SetField(fieldName string, value any) error {
	return StandardFieldSet(r, fieldName, value)
}

func (r *Route) GetField(fieldName string) (any, error) {
	return StandardFieldGet(r, fieldName)
}

func (r *Route) Loop(iter func(string, any) error) error {
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
	} else if routeType == "bot" {
		r.BotRef, err = pickRequiredMetadataItem(node, "bot", r.Namespace)
		if err != nil || r.BotRef == "" {
			return errors.New("bot property is required for Run Bot routes")
		}
	} else {
		r.ViewRef, err = pickRequiredMetadataItem(node, "view", r.Namespace)
		if err != nil {
			return fmt.Errorf("invalid route %s: %s", r.GetKey(), err.Error())
		}
		r.ThemeRef = pickMetadataItem(node, "theme", r.Namespace, "")
	}
	return node.Decode((*RouteWrapper)(r))
}

func (r *Route) MarshalYAML() (any, error) {
	r.ThemeRef = GetLocalizedKey(r.ThemeRef, r.Namespace)
	r.ViewRef = GetLocalizedKey(r.ViewRef, r.Namespace)
	r.BotRef = GetLocalizedKey(r.BotRef, r.Namespace)
	return (*RouteWrapper)(r), nil
}

// SetResponse is used by the Route Bot runtime to specify what type of response to return
// to the client, in the context of a particular request.
func (r *Route) SetResponse(response *bots.RouteResponse) {
	r.response = response
}

// GetResponse is used by the Route Bot runtime to determine what type of response to return
// to the client, in the context of a particular request.
func (r *Route) GetResponse() *bots.RouteResponse {
	return r.response
}

func (r *Route) Copy() *Route {
	newRoute := r
	paramsCopy := map[string]any{}
	if r.Params != nil {
		maps.Copy(paramsCopy, r.Params)
	}
	newRoute.Params = paramsCopy
	return newRoute
}
