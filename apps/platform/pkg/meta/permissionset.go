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

type CollectionPermission struct {
	Read       bool               `yaml:"read" json:"read"`
	Create     bool               `yaml:"create" json:"create"`
	Edit       bool               `yaml:"edit" json:"edit"`
	Delete     bool               `yaml:"delete" json:"delete"`
	ModifyAll  bool               `yaml:"modifyall" json:"modifyall"`
	ViewAll    bool               `yaml:"viewall" json:"viewall"`
	FieldsRefs FieldPermissionMap `yaml:"fields" json:"fields"`
}

type CollectionPermissionMap map[string]CollectionPermission

type FieldPermission struct {
	Read bool `yaml:"read" json:"read"`
	Edit bool `yaml:"edit" json:"edit"`
}

type FieldPermissionMap map[string]FieldPermission

func (cpm *CollectionPermissionMap) UnmarshalYAML(node *yaml.Node) error {

	if *cpm == nil {
		*cpm = *(&CollectionPermissionMap{})
	}

	collectionPermissionPairs, err := GetMapNodes(node)
	if err != nil {
		return err
	}

	for _, collectionPermissionPair := range collectionPermissionPairs {
		node := collectionPermissionPair.Node
		if node == nil {
			return nil
		}
		if node.Kind == yaml.MappingNode {
			cp := CollectionPermission{}
			node.Decode((*CollectionPermission)(&cp))
			(*cpm)[collectionPermissionPair.Key] = cp
		}
		if node.Kind == yaml.ScalarNode {
			// Backwards compatible support for old metadata format
			if node.Value == "true" || node.Value == "null" || node.Value == "" {
				(*cpm)[collectionPermissionPair.Key] = CollectionPermission{
					Read:   true,
					Create: true,
					Edit:   true,
					Delete: true,
				}
			}
		}
	}

	return nil
}

type PermissionSet struct {
	BuiltIn             `yaml:",inline"`
	BundleableBase      `yaml:",inline"`
	NamedRefs           map[string]bool         `yaml:"named" json:"uesio/studio.namedrefs"`
	ViewRefs            map[string]bool         `yaml:"views" json:"uesio/studio.viewrefs"`
	CollectionRefs      CollectionPermissionMap `yaml:"collections" json:"uesio/studio.collectionrefs"`
	RouteRefs           map[string]bool         `yaml:"routes" json:"uesio/studio.routerefs"`
	FileRefs            map[string]bool         `yaml:"files" json:"uesio/studio.filerefs"`
	BotRefs             map[string]bool         `yaml:"bots" json:"uesio/studio.botrefs"`
	AllowAllBots        bool                    `yaml:"allowallbots" json:"uesio/studio.allowallbots"`
	AllowAllCollections bool                    `yaml:"allowallcollections" json:"uesio/studio.allowallcollections"`
	AllowAllViews       bool                    `yaml:"allowallviews" json:"uesio/studio.allowallviews"`
	AllowAllRoutes      bool                    `yaml:"allowallroutes" json:"uesio/studio.allowallroutes"`
	AllowAllFiles       bool                    `yaml:"allowallfiles" json:"uesio/studio.allowallfiles"`
	ModifyAllRecords    bool                    `yaml:"modifyallrecords" json:"uesio/studio.modifyallrecords"`
	ViewAllRecords      bool                    `yaml:"viewallrecords" json:"uesio/studio.viewallrecords"`
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

	if !ps.AllowAllBots {
		for key, value := range check.BotRefs {
			if value {
				if !ps.BotRefs[key] {
					return false
				}
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
		for key := range check.CollectionRefs {
			if _, ok := ps.CollectionRefs[key]; !ok {
				return false
			}
		}
	}

	return true
}

func (ps *PermissionSet) HasCollectionReadPermission(key string) bool {
	if ps.AllowAllCollections {
		return true
	}
	if collectionPermission, ok := ps.CollectionRefs[key]; !ok {
		return false
	} else {
		return collectionPermission.ModifyAll || collectionPermission.ViewAll || collectionPermission.Read
	}
}

func (ps *PermissionSet) HasFieldReadPermission(collectionKey string, key string) bool {
	if fieldPermission, ok := ps.CollectionRefs[collectionKey].FieldsRefs[key]; !ok {
		return true
	} else {
		return fieldPermission.Read
	}

}

func (ps *PermissionSet) HasFieldEditPermission(collectionKey string, key string) bool {
	if fieldPermission, ok := ps.CollectionRefs[collectionKey].FieldsRefs[key]; !ok {
		return true
	} else {
		return fieldPermission.Edit
	}
}

func (ps *PermissionSet) HasCreatePermission(key string) bool {
	if ps.AllowAllCollections {
		return true
	}
	if collectionPermission, ok := ps.CollectionRefs[key]; !ok {
		return false
	} else {
		return collectionPermission.ModifyAll || collectionPermission.Create
	}
}

func (ps *PermissionSet) HasEditPermission(key string) bool {
	if ps.AllowAllCollections {
		return true
	}
	if collectionPermission, ok := ps.CollectionRefs[key]; !ok {
		return false
	} else {
		return collectionPermission.ModifyAll || collectionPermission.Edit
	}
}

func (ps *PermissionSet) HasDeletePermission(key string) bool {
	if ps.AllowAllCollections {
		return true
	}
	if collectionPermission, ok := ps.CollectionRefs[key]; !ok {
		return false
	} else {
		return collectionPermission.ModifyAll || collectionPermission.Delete
	}
}

func (ps *PermissionSet) HasNamedPermission(namedPermission string) bool {
	if ps.NamedRefs == nil {
		return false
	}
	return ps.NamedRefs[namedPermission] == true
}

func FlattenPermissions(permissionSets []PermissionSet) *PermissionSet {
	botPerms := map[string]bool{}
	namedPerms := map[string]bool{}
	viewPerms := map[string]bool{}
	routePerms := map[string]bool{}
	filePerms := map[string]bool{}
	collectionPerms := CollectionPermissionMap{}
	allowAllBots := false
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
		for key, value := range permissionSet.BotRefs {
			if value {
				botPerms[key] = true
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
			if existingVal, ok := collectionPerms[key]; !ok {
				collectionPerms[key] = value
			} else {
				existingVal.ModifyAll = existingVal.ModifyAll || value.ModifyAll
				existingVal.ViewAll = existingVal.ViewAll || value.ViewAll
				existingVal.Create = existingVal.Create || value.Create
				existingVal.Delete = existingVal.Delete || value.Delete
				existingVal.Edit = existingVal.Edit || value.Edit
				existingVal.Read = existingVal.Read || value.Read
				collectionPerms[key] = existingVal
			}
		}
		if permissionSet.AllowAllBots {
			allowAllBots = true
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
		BotRefs:             botPerms,
		RouteRefs:           routePerms,
		FileRefs:            filePerms,
		CollectionRefs:      collectionPerms,
		AllowAllBots:        allowAllBots,
		AllowAllViews:       allowAllViews,
		AllowAllRoutes:      allowAllRoutes,
		AllowAllFiles:       allowAllFiles,
		AllowAllCollections: allowAllCollections,
		ModifyAllRecords:    modifyAllRecords,
		ViewAllRecords:      viewAllRecords,
	}
}

// Returns a permissionset that has the maximum permissions possible
func GetAdminPermissionSet() *PermissionSet {
	return &PermissionSet{
		AllowAllBots:        true,
		AllowAllViews:       true,
		AllowAllRoutes:      true,
		AllowAllFiles:       true,
		AllowAllCollections: true,
		ModifyAllRecords:    true,
		ViewAllRecords:      true,
	}
}
