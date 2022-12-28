package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

func NewPermissionSet(key string) (*PermissionSet, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for PermissionSet")
	}
	return NewBasePermissionSet(namespace, name), nil
}

func NewBasePermissionSet(namespace, name string) *PermissionSet {
	return &PermissionSet{BundleableBase: NewBase(namespace, name)}
}

type PermissionSet struct {
	NamedRefs           map[string]bool `yaml:"named" json:"uesio/studio.namedrefs"`
	ViewRefs            map[string]bool `yaml:"views" json:"uesio/studio.viewrefs"`
	CollectionRefs      map[string]bool `yaml:"collections" json:"uesio/studio.collectionrefs"`
	RouteRefs           map[string]bool `yaml:"routes" json:"uesio/studio.routerefs"`
	FileRefs            map[string]bool `yaml:"files" json:"uesio/studio.filerefs"`
	AllowAllCollections bool            `yaml:"allowallcollections" json:"uesio/studio.allowallcollections"`
	AllowAllViews       bool            `yaml:"allowallviews" json:"uesio/studio.allowallviews"`
	AllowAllRoutes      bool            `yaml:"allowallroutes" json:"uesio/studio.allowallroutes"`
	AllowAllFiles       bool            `yaml:"allowallfiles" json:"uesio/studio.allowallfiles"`
	ModifyAllRecords    bool            `yaml:"modifyallrecords" json:"uesio/studio.modifyallrecords"`
	ViewAllRecords      bool            `yaml:"viewallrecords" json:"uesio/studio.viewallrecords"`
	BuiltIn
	BundleableBase `yaml:",inline"`
}

type PermissionSetWrapper PermissionSet

func (ps *PermissionSet) GetCollectionName() string {
	return PERMISSIONSET_COLLECTION_NAME
}

func (ps *PermissionSet) GetBundleFolderName() string {
	return PERMISSIONSET_FOLDER_NAME
}

func (ps *PermissionSet) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ps, fieldName, value)
}

func (ps *PermissionSet) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ps, fieldName)
}

func (ps *PermissionSet) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ps, iter)
}

func (ps *PermissionSet) Len() int {
	return StandardItemLen(ps)
}

func (ps *PermissionSet) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, ps.Name)
	if err != nil {
		return err
	}
	return node.Decode((*PermissionSetWrapper)(ps))
}

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
	modifyAllRecords := false
	viewAllRecords := false

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
		if permissionSet.ModifyAllRecords {
			modifyAllRecords = true
		}
		if permissionSet.ViewAllRecords {
			viewAllRecords = true
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
		ModifyAllRecords:    modifyAllRecords,
		ViewAllRecords:      viewAllRecords,
	}
}
