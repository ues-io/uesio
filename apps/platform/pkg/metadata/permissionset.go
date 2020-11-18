package metadata

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// NewPermissionSet function
func NewPermissionSet(key string) (*PermissionSet, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for PermissionSet")
	}
	return &PermissionSet{
		Name:      name,
		Namespace: namespace,
	}, nil
}

// PermissionSet struct
type PermissionSet struct {
	Name           string          `yaml:"name" uesio:"uesio.name"`
	Namespace      string          `yaml:"-" uesio:"-"`
	NamedRefs      map[string]bool `yaml:"named" uesio:"-"`
	ViewRefs       map[string]bool `yaml:"views" uesio:"-"`
	RouteRefs      map[string]bool `yaml:"routes" uesio:"-"`
	FileRefs       map[string]bool `yaml:"files" uesio:"-"`
	Workspace      string          `yaml:"-" uesio:"uesio.workspaceid"`
	AllowAllViews  bool            `yaml:"-" uesio:"-"`
	AllowAllRoutes bool            `yaml:"-" uesio:"-"`
	AllowAllFiles  bool            `yaml:"-" uesio:"-"`
}

// GetCollectionName function
func (ps *PermissionSet) GetCollectionName() string {
	return ps.GetBundleGroup().GetName()
}

// GetCollection function
func (ps *PermissionSet) GetCollection() CollectionableGroup {
	var psc PermissionSetCollection
	return &psc
}

// GetConditions function
func (ps *PermissionSet) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: ps.Name,
		},
	}, nil
}

// GetBundleGroup function
func (ps *PermissionSet) GetBundleGroup() BundleableGroup {
	var psc PermissionSetCollection
	return &psc
}

// GetKey function
func (ps *PermissionSet) GetKey() string {
	return ps.Namespace + "." + ps.Name
}

// GetPermChecker function
func (ps *PermissionSet) GetPermChecker() *PermissionSet {
	return nil
}

// GetNamespace function
func (ps *PermissionSet) GetNamespace() string {
	return ps.Namespace
}

// SetNamespace function
func (ps *PermissionSet) SetNamespace(namespace string) {
	ps.Namespace = namespace
}

// SetWorkspace function
func (ps *PermissionSet) SetWorkspace(workspace string) {
	ps.Workspace = workspace
}

// HasPermission method
func (ps *PermissionSet) HasPermission(check *PermissionSet) bool {
	if check == nil {
		return true
	}
	for key, value := range check.NamedRefs {
		if value {
			if !ps.NamedRefs[key] {
				return false
			}
		}
	}
	if !ps.AllowAllViews {
		for key, value := range check.ViewRefs {
			if value {
				if !ps.ViewRefs[key] {
					return false
				}
			}
		}
	}

	if !ps.AllowAllRoutes {
		for key, value := range check.RouteRefs {
			if value {
				if !ps.RouteRefs[key] {
					return false
				}
			}
		}
	}

	if !ps.AllowAllFiles {
		for key, value := range check.FileRefs {
			if value {
				if !ps.FileRefs[key] {
					return false
				}
			}
		}
	}

	return true
}

// FlattenPermissions flattens the permissions
func FlattenPermissions(permissionSets []PermissionSet) *PermissionSet {
	namedPerms := map[string]bool{}
	viewPerms := map[string]bool{}
	routePerms := map[string]bool{}
	filePerms := map[string]bool{}

	for _, permissionSet := range permissionSets {
		for key, value := range permissionSet.NamedRefs {
			if value {
				namedPerms[key] = true
			}
		}
		for key, value := range permissionSet.ViewRefs {
			if value {
				viewPerms[key] = true
			}
		}
		for key, value := range permissionSet.RouteRefs {
			if value {
				routePerms[key] = true
			}
		}
		for key, value := range permissionSet.FileRefs {
			if value {
				filePerms[key] = true
			}
		}
	}

	return &PermissionSet{
		NamedRefs: namedPerms,
		ViewRefs:  viewPerms,
		RouteRefs: routePerms,
		FileRefs:  filePerms,
	}
}
