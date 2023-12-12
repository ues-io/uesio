package meta

import (
	"errors"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/constant"
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

type IntegrationPermission struct {
	AllowAll    bool            `yaml:"allowAllActions" json:"allowAllActions"`
	ActionPerms map[string]bool `yaml:"actions" json:"actions"`
}

type IntegrationPermissionMap map[string]IntegrationPermission

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
	BuiltIn                    `yaml:",inline"`
	BundleableBase             `yaml:",inline"`
	NamedRefs                  map[string]bool          `yaml:"named" json:"uesio/studio.namedrefs"`
	ViewRefs                   map[string]bool          `yaml:"views" json:"uesio/studio.viewrefs"`
	CollectionRefs             CollectionPermissionMap  `yaml:"collections" json:"uesio/studio.collectionrefs"`
	RouteRefs                  map[string]bool          `yaml:"routes" json:"uesio/studio.routerefs"`
	FileRefs                   map[string]bool          `yaml:"files" json:"uesio/studio.filerefs"`
	BotRefs                    map[string]bool          `yaml:"bots" json:"uesio/studio.botrefs"`
	IntegrationActionRefs      IntegrationPermissionMap `yaml:"integrationActions" json:"uesio/studio.integrationactionrefs"`
	AllowAllBots               bool                     `yaml:"allowallbots" json:"uesio/studio.allowallbots"`
	AllowAllCollections        bool                     `yaml:"allowallcollections" json:"uesio/studio.allowallcollections"`
	AllowAllViews              bool                     `yaml:"allowallviews" json:"uesio/studio.allowallviews"`
	AllowAllRoutes             bool                     `yaml:"allowallroutes" json:"uesio/studio.allowallroutes"`
	AllowAllFiles              bool                     `yaml:"allowallfiles" json:"uesio/studio.allowallfiles"`
	AllowAllIntegrationActions bool                     `yaml:"allowallintegrationactions" json:"uesio/studio.allowallintegrationactions"`
	ModifyAllRecords           bool                     `yaml:"modifyallrecords" json:"uesio/studio.modifyallrecords"`
	ViewAllRecords             bool                     `yaml:"viewallrecords" json:"uesio/studio.viewallrecords"`
}

type PermissionSetWrapper PermissionSet

func (ps *PermissionSet) GetCollection() CollectionableGroup {
	return &PermissionSetCollection{}
}

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

	if !ps.AllowAllIntegrationActions {
		for checkIntegrationName, _ := range check.IntegrationActionRefs {
			_, hasEntry := ps.IntegrationActionRefs[checkIntegrationName]
			if !hasEntry {
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
		for key := range check.CollectionRefs {
			if _, ok := ps.CollectionRefs[key]; !ok {
				return false
			}
		}
	}

	return true
}

// CanCallBot returns true if the user either:
// (A) Has permission to call any Listener/Generator Bot
// (B) Has permission to call the particular Listener/Generator bot requested
func (ps *PermissionSet) CanCallBot(botKey string) bool {
	if ps.AllowAllBots {
		return true
	}
	if ps.BotRefs == nil {
		return false
	}
	if ps.BotRefs[botKey] {
		return true
	}
	return false
}

func (ps *PermissionSet) CanRunIntegrationAction(integrationName, actionName string) bool {
	if ps.AllowAllIntegrationActions {
		return true
	}
	integrationPerms, hasIntegrationPerms := ps.IntegrationActionRefs[integrationName]
	if !hasIntegrationPerms {
		return false
	}
	if integrationPerms.AllowAll {
		return true
	}
	if integrationPerms.ActionPerms == nil {
		return false
	}
	return integrationPerms.ActionPerms[actionName]
}

func (ps *PermissionSet) HasCollectionReadPermission(key string) bool {
	if key == constant.CommonCollection {
		return false
	}
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

func (ps *PermissionSet) AddNamedPermission(namedPermission string) {
	if ps.NamedRefs == nil {
		ps.NamedRefs = map[string]bool{}
	}
	ps.NamedRefs[namedPermission] = true
}

func FlattenPermissions(permissionSets []PermissionSet) *PermissionSet {

	allowAllBots := false
	allowAllIntegrationActions := false
	allowAllViews := false
	allowAllRoutes := false
	allowAllFiles := false
	allowAllCollections := false
	modifyAllRecords := false
	viewAllRecords := false

	namedPerms := map[string]bool{}

	// Do the "AllowAll" checks first so that we can bypass other checks
	for _, permissionSet := range permissionSets {
		if permissionSet.AllowAllBots {
			allowAllBots = true
		}
		if permissionSet.AllowAllIntegrationActions {
			allowAllIntegrationActions = true
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
		// Also do the named perm checks because there's no "Allow All" equivalent
		for key, value := range permissionSet.NamedRefs {
			if value {
				namedPerms[key] = true
			}
		}
	}

	var botPerms, filePerms, routePerms, viewPerms map[string]bool
	var integrationActionPerms IntegrationPermissionMap
	var collectionPerms CollectionPermissionMap

	// Only initialize the maps if the "AllowAll" props are false
	if !allowAllBots {
		botPerms = map[string]bool{}
	}
	if !allowAllCollections {
		collectionPerms = CollectionPermissionMap{}
	}
	if !allowAllIntegrationActions {
		integrationActionPerms = IntegrationPermissionMap{}
	}
	if !allowAllFiles {
		filePerms = map[string]bool{}
	}
	if !allowAllRoutes {
		routePerms = map[string]bool{}
	}
	if !allowAllViews {
		viewPerms = map[string]bool{}
	}

	for _, permissionSet := range permissionSets {
		// Don't bother with Bot-specific checks if we can run all
		if !allowAllBots {
			for key, value := range permissionSet.BotRefs {
				if value {
					botPerms[key] = true
				}
			}
		}
		// Don't bother with integration-specific checks if we can run all
		if !allowAllIntegrationActions {
			for integrationName, integrationPerms := range permissionSet.IntegrationActionRefs {
				if existingVal, ok := integrationActionPerms[integrationName]; !ok {
					integrationActionPerms[integrationName] = integrationPerms
				} else {
					existingVal.AllowAll = existingVal.AllowAll || integrationPerms.AllowAll
					// If AllowAll, we don't need to track actions-specific perms anymore, so clear them out
					if existingVal.AllowAll {
						existingVal.ActionPerms = nil
						continue
					}
					// Otherwise we need to keep track of action-specific perms
					if existingVal.ActionPerms == nil {
						existingVal.ActionPerms = integrationPerms.ActionPerms
					} else if integrationActionPerms != nil {
						for actionName, isAllowed := range integrationPerms.ActionPerms {
							// Only add an entry if it is allowed
							if isAllowed {
								existingVal.ActionPerms[actionName] = existingVal.ActionPerms[actionName] || isAllowed
							}
						}
					}
				}
			}
		}
		if !allowAllViews {
			for key, value := range permissionSet.ViewRefs {
				if value {
					viewPerms[key] = true
				}
			}
		}
		if !allowAllRoutes {
			for key, value := range permissionSet.RouteRefs {
				if value {
					routePerms[key] = true
				}
			}
		}
		if !allowAllFiles {
			for key, value := range permissionSet.FileRefs {
				if value {
					filePerms[key] = true
				}
			}
		}
		if !allowAllCollections {
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
		}
	}

	return &PermissionSet{
		NamedRefs:                  namedPerms,
		ViewRefs:                   viewPerms,
		BotRefs:                    botPerms,
		IntegrationActionRefs:      integrationActionPerms,
		RouteRefs:                  routePerms,
		FileRefs:                   filePerms,
		CollectionRefs:             collectionPerms,
		AllowAllBots:               allowAllBots,
		AllowAllIntegrationActions: allowAllIntegrationActions,
		AllowAllViews:              allowAllViews,
		AllowAllRoutes:             allowAllRoutes,
		AllowAllFiles:              allowAllFiles,
		AllowAllCollections:        allowAllCollections,
		ModifyAllRecords:           modifyAllRecords,
		ViewAllRecords:             viewAllRecords,
	}
}

// GetAdminPermissionSet Returns a PermissionSet that has the maximum permissions possible
func GetAdminPermissionSet() *PermissionSet {
	return &PermissionSet{
		AllowAllBots:               true,
		AllowAllIntegrationActions: true,
		AllowAllViews:              true,
		AllowAllRoutes:             true,
		AllowAllFiles:              true,
		AllowAllCollections:        true,
		ModifyAllRecords:           true,
		ViewAllRecords:             true,
		NamedRefs: map[string]bool{
			constant.WorkspaceAdminPerm: true,
		},
	}
}
