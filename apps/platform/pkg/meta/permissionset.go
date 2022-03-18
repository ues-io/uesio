package meta

import (
	"errors"
	"fmt"

	"github.com/humandad/yaml"
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
	ID                  string          `yaml:"-" uesio:"uesio/core.id"`
	Name                string          `yaml:"name" uesio:"uesio/studio.name"`
	Namespace           string          `yaml:"-" uesio:"-"`
	NamedRefs           map[string]bool `yaml:"named" uesio:"uesio/studio.namedrefs"`
	ViewRefs            map[string]bool `yaml:"views" uesio:"uesio/studio.viewrefs"`
	CollectionRefs      map[string]bool `yaml:"collections" uesio:"uesio/studio.collectionrefs"`
	RouteRefs           map[string]bool `yaml:"routes" uesio:"uesio/studio.routerefs"`
	FileRefs            map[string]bool `yaml:"files" uesio:"uesio/studio.filerefs"`
	Workspace           *Workspace      `yaml:"-" uesio:"uesio/studio.workspace"`
	AllowAllCollections bool            `yaml:"allowallcollections" uesio:"uesio/studio.allowallcollections"`
	AllowAllViews       bool            `yaml:"allowallviews" uesio:"uesio/studio.allowallviews"`
	AllowAllRoutes      bool            `yaml:"allowallroutes" uesio:"uesio/studio.allowallroutes"`
	AllowAllFiles       bool            `yaml:"allowallfiles" uesio:"uesio/studio.allowallfiles"`
	itemMeta            *ItemMeta       `yaml:"-" uesio:"-"`
	CreatedBy           *User           `yaml:"-" uesio:"uesio/core.createdby"`
	Owner               *User           `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy           *User           `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt           int64           `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt           int64           `yaml:"-" uesio:"uesio/core.createdat"`
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

func (ps *PermissionSet) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, ps.Name)
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

// GetPath function
func (ps *PermissionSet) GetPath() string {
	return ps.Name + ".yaml"
}

// GetPermChecker function
func (ps *PermissionSet) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (ps *PermissionSet) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ps, fieldName, value)
}

// GetField function
func (ps *PermissionSet) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ps, fieldName)
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
	ps.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (ps *PermissionSet) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ps, iter)
}

// Len function
func (ps *PermissionSet) Len() int {
	return StandardItemLen(ps)
}

// GetItemMeta function
func (ps *PermissionSet) GetItemMeta() *ItemMeta {
	return ps.itemMeta
}

// SetItemMeta function
func (ps *PermissionSet) SetItemMeta(itemMeta *ItemMeta) {
	ps.itemMeta = itemMeta
}

func (ps *PermissionSet) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, ps.Name)
	if err != nil {
		return err
	}
	return node.Decode(ps)
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

	if !ps.AllowAllCollections {
		for key, value := range check.CollectionRefs {

			if value {
				if !ps.CollectionRefs[key] {
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
	collectionPerms := map[string]bool{}
	allowAllViews := false
	allowAllRoutes := false
	allowAllFiles := false
	allowAllCollections := false

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
		for key, value := range permissionSet.CollectionRefs {
			if value {
				collectionPerms[key] = true
			}
		}
		if permissionSet.AllowAllViews {
			allowAllViews = true
		}
		if permissionSet.AllowAllRoutes {
			allowAllRoutes = true
		}
		if permissionSet.AllowAllFiles {
			allowAllFiles = true
		}
		if permissionSet.AllowAllCollections {
			allowAllCollections = true
		}
	}

	return &PermissionSet{
		NamedRefs:           namedPerms,
		ViewRefs:            viewPerms,
		RouteRefs:           routePerms,
		FileRefs:            filePerms,
		CollectionRefs:      collectionPerms,
		AllowAllViews:       allowAllViews,
		AllowAllRoutes:      allowAllRoutes,
		AllowAllFiles:       allowAllFiles,
		AllowAllCollections: allowAllCollections,
	}
}
