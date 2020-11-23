package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// NewRoute function
func NewRoute(key string) (*Route, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid Route Key: " + key)
	}
	return &Route{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	}, nil
}

// Route struct
type Route struct {
	Name      string            `uesio:"uesio.name"`
	Namespace string            `yaml:"-" uesio:"-"`
	Path      string            `yaml:"path" uesio:"uesio.path"`
	ViewRef   string            `yaml:"view" uesio:"uesio.view"`
	Params    map[string]string `yaml:"-" uesio:"-"`
	Workspace string            `yaml:"-" uesio:"uesio.workspaceid"`
}

// GetCollectionName function
func (r *Route) GetCollectionName() string {
	return r.GetBundleGroup().GetName()
}

// GetCollection function
func (r *Route) GetCollection() CollectionableGroup {
	var rc RouteCollection
	return &rc
}

// GetConditions function
func (r *Route) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: r.Name,
		},
	}, nil
}

// GetBundleGroup function
func (r *Route) GetBundleGroup() BundleableGroup {
	var rc RouteCollection
	return &rc
}

// GetKey function
func (r *Route) GetKey() string {
	return r.Namespace + "." + r.Name
}

// GetPermChecker function
func (r *Route) GetPermChecker() *PermissionSet {
	key := r.GetKey()
	return &PermissionSet{
		RouteRefs: map[string]bool{
			key: true,
		},
	}
}

// GetNamespace function
func (r *Route) GetNamespace() string {
	return r.Namespace
}

// SetNamespace function
func (r *Route) SetNamespace(namespace string) {
	r.Namespace = namespace
}

// SetWorkspace function
func (r *Route) SetWorkspace(workspace string) {
	r.Workspace = workspace
}
