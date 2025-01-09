package meta

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/qdm12/reprint"

	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/reflecttool"
)

type ItemMeta struct {
	ValidFields map[string]bool
}

func (im *ItemMeta) IsValidField(fieldName string) bool {
	if im.ValidFields != nil {
		valid, ok := im.ValidFields[fieldName]
		return ok && valid
	}
	return true
}

type BuiltIn struct {
	ID        string    `yaml:"-" json:"uesio/core.id"`
	UniqueKey string    `yaml:"-" json:"uesio/core.uniquekey"`
	itemMeta  *ItemMeta `yaml:"-" json:"-"`
	CreatedBy *User     `yaml:"-" json:"uesio/core.createdby,omitempty"`
	Owner     *User     `yaml:"-" json:"uesio/core.owner,omitempty"`
	UpdatedBy *User     `yaml:"-" json:"uesio/core.updatedby,omitempty"`
	UpdatedAt int64     `yaml:"-" json:"uesio/core.updatedat,omitempty"`
	CreatedAt int64     `yaml:"-" json:"uesio/core.createdat,omitempty"`
}

func (bi *BuiltIn) SetModified(mod time.Time) {
	bi.UpdatedAt = mod.Unix()
}

func (bi *BuiltIn) SetModifiedBy(user *User) {
	bi.UpdatedBy = user
}

func (bi *BuiltIn) SetCreated(mod time.Time) {
	bi.CreatedAt = mod.Unix()
}

func (bi *BuiltIn) SetCreatedBy(user *User) {
	bi.CreatedBy = user
}

func (bi *BuiltIn) SetOwner(user *User) {
	bi.Owner = user
}

func (bi *BuiltIn) GetItemMeta() *ItemMeta {
	return bi.itemMeta
}

func (bi *BuiltIn) SetItemMeta(itemMeta *ItemMeta) {
	bi.itemMeta = itemMeta
}

type BundleConditions map[string]interface{}

type CollectionableGroup interface {
	Group
	GetName() string
	GetFields() []string
}

type CollectionableItem interface {
	Item
	GetCollectionName() string
	GetCollection() CollectionableGroup
	GetItemMeta() *ItemMeta
	SetItemMeta(*ItemMeta)
}

type FilterFunc func(string, BundleConditions, bool) bool

type BundleableGroup interface {
	CollectionableGroup
	GetBundleFolderName() string
	FilterPath(string, BundleConditions, bool) bool
	GetItemFromPath(string, string) BundleableItem
	GetItemFromKey(string) (BundleableItem, error)
}

type AttachableGroup interface {
	BundleableGroup
	IsDefinitionPath(string) bool
}

type AttachableItem interface {
	BundleableItem
	GetBasePath() string
}

// BundleLoader is a function which loads metadata for a given BundleableItem,
// presumably from a Bundle Store (or from a mock implementation)
type BundleLoader func(item BundleableItem) error

type BundleableItem interface {
	CollectionableItem
	GetBundleFolderName() string
	GetPermChecker() *PermissionSet
	GetKey() string
	GetPath() string
	GetDBID(string) string
	SetNamespace(string)
	GetNamespace() string
	SetLabel(string)
	GetLabel() string
	SetModified(time.Time)
	SetModifiedBy(*User)
	SetCreated(time.Time)
	SetCreatedBy(*User)
	SetOwner(*User)
	IsPublic() bool
}

// ParseKey splits a uesio metadata key into its namespace and name,
// e.g. "uesio/io.table" would parse into (namespace="uesio/io", name="table")
func ParseKey(key string) (namespace string, name string, err error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return "", "", errors.New("Invalid Key: " + key)
	}
	return keyArray[0], keyArray[1], nil
}

func ParseKeyWithDefault(key, defaultNamespace string) (string, string, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) == 2 {
		return keyArray[0], keyArray[1], nil
	}
	if len(keyArray) == 1 {
		return defaultNamespace, key, nil
	}
	return "", "", errors.New("Invalid Key With Default: " + key)
}

func ParseNamespace(namespace string) (string, string, error) {
	keyArray := strings.Split(namespace, "/")
	if len(keyArray) != 2 {
		return "", "", errors.New("Invalid Namespace: " + namespace)
	}
	return keyArray[0], keyArray[1], nil
}

func StandardPathFilter(path string) bool {
	parts := strings.Split(path, "/")
	if len(parts) != 1 || !strings.HasSuffix(parts[0], ".yaml") {
		// Ignore this file
		return false
	}
	return true
}

// GroupedPathFilter filters a metadata tree where each item lives within a namespaced folder,
// and where a specific BundleCondition field specifies the fully qualified item key.
// For example, Collection Fields --- each field lives within a folder corresponding to
// the field's Collection, e.g. if we had this folder structure:
//
//	 uesio/
//	    crm/
//			  account/
//				  mailing_zip.yaml
//				  mailing_country.yaml
//			  contact/
//				  first_name.yaml
//				  last_name.yaml
//
// then we might have
//
//	BundleConditions = { "uesio/studio.collection": ["uesio/crm.account", "uesio/crm.contact] }
//		--> returns all 4 fields
//	BundleConditions = { "uesio/studio.collection": ["uesio/crm.contact"] }
//		--> returns just the fields for uesio/crm.contact collection
//	BundleConditions = { "uesio/studio.collection": ["luigi/foo.bar"] }
//		--> returns no fields.
func GroupedPathFilter(path, conditionField string, conditions BundleConditions) bool {
	conditionValue, hasConditionValue := conditions[conditionField]
	parts := strings.Split(path, "/")
	if len(parts) != 4 || !strings.HasSuffix(parts[3], ".yaml") {
		// Ignore this file
		return false
	}
	if hasConditionValue {
		foundMatch := false
		metadataGroupKeys, ok := goutils.StringSliceValue(conditionValue)
		// If the filter was bad, don't return a value
		if !ok {
			return false
		}
		// Iterate over the metadata groupings requested and see if we find a match
		for i := range metadataGroupKeys {
			groupNS, groupName, err := ParseKey(metadataGroupKeys[i])
			if err != nil {
				return false
			}
			nsUser, nsApp, err := ParseNamespace(groupNS)
			if err != nil {
				return false
			}
			if parts[0] == nsUser && parts[1] == nsApp && parts[2] == groupName {
				// We only need to find one match for the item to be returned from the filter
				foundMatch = true
				break
			}
		}
		return foundMatch
	}
	return true
}

func StandardNameFromPath(path string) string {
	return strings.TrimSuffix(path, ".yaml")
}

func StandardGetFields(item CollectionableItem) []string {
	names, err := reflecttool.GetFieldNames(item)
	if err != nil {
		return []string{}
	}
	return names
}

func StandardFieldGet(item CollectionableItem, fieldName string) (interface{}, error) {
	itemMeta := item.GetItemMeta()
	if itemMeta != nil && !itemMeta.IsValidField(fieldName) {
		return nil, errors.New("Field Not Found: " + item.GetCollectionName() + " : " + fieldName)
	}
	return reflecttool.GetField(item, fieldName)
}

func StandardFieldSet(item CollectionableItem, fieldName string, value interface{}) error {
	err := reflecttool.SetField(item, fieldName, value)
	if err != nil {
		return fmt.Errorf("Failed to set field: %s on item: %s: %w", fieldName, item.GetCollectionName(), err)
	}
	return nil
}

func StandardItemLoop(item CollectionableItem, iter func(string, interface{}) error) error {
	itemMeta := item.GetItemMeta()
	for _, fieldName := range StandardGetFields(item) {
		if itemMeta != nil && !itemMeta.IsValidField(fieldName) {
			continue
		}
		val, err := item.GetField(fieldName)
		if err != nil {
			return err
		}
		err = iter(fieldName, val)
		if err != nil {
			return err
		}
	}
	return nil
}

func StandardItemLen(item CollectionableItem) int {
	return len(StandardGetFields(item))
}

type BundleableFactory func() BundleableGroup

var METADATA_NAME_MAP = map[string]string{
	"COLLECTION":           "collections",
	"FIELD":                "fields",
	"VIEW":                 "views",
	"AUTHSOURCE":           "authsources",
	"SIGNUPMETHOD":         "signupmethods",
	"SECRET":               "secrets",
	"THEME":                "themes",
	"SELECTLIST":           "selectlists",
	"BOT":                  "bots",
	"CREDENTIALS":          "credentials",
	"ROUTE":                "routes",
	"PROFILE":              "profiles",
	"PERMISSIONSET":        "permissionsets",
	"COMPONENTVARIANT":     "componentvariants",
	"COMPONENTPACK":        "componentpacks",
	"COMPONENT":            "components",
	"FILE":                 "files",
	"LABEL":                "labels",
	"INTEGRATIONTYPE":      "integrationtypes",
	"INTEGRATION":          "integrations",
	"INTEGRATIONACTION":    "integrationactions",
	"RECORDCHALLENGETOKEN": "recordchallengetokens",
	"USERACCESSTOKEN":      "useraccesstokens",
}

var bundleableGroupMap = map[string]BundleableFactory{
	(&SecretCollection{}).GetBundleFolderName():               func() BundleableGroup { return &SecretCollection{} },
	(&ProfileCollection{}).GetBundleFolderName():              func() BundleableGroup { return &ProfileCollection{} },
	(&PermissionSetCollection{}).GetBundleFolderName():        func() BundleableGroup { return &PermissionSetCollection{} },
	(&ConfigValueCollection{}).GetBundleFolderName():          func() BundleableGroup { return &ConfigValueCollection{} },
	(&FileSourceCollection{}).GetBundleFolderName():           func() BundleableGroup { return &FileSourceCollection{} },
	(&FileCollection{}).GetBundleFolderName():                 func() BundleableGroup { return &FileCollection{} },
	(&FieldCollection{}).GetBundleFolderName():                func() BundleableGroup { return &FieldCollection{} },
	(&FontCollection{}).GetBundleFolderName():                 func() BundleableGroup { return &FontCollection{} },
	(&BotCollection{}).GetBundleFolderName():                  func() BundleableGroup { return &BotCollection{} },
	(&CollectionCollection{}).GetBundleFolderName():           func() BundleableGroup { return &CollectionCollection{} },
	(&SelectListCollection{}).GetBundleFolderName():           func() BundleableGroup { return &SelectListCollection{} },
	(&RouteCollection{}).GetBundleFolderName():                func() BundleableGroup { return &RouteCollection{} },
	(&RouteAssignmentCollection{}).GetBundleFolderName():      func() BundleableGroup { return &RouteAssignmentCollection{} },
	(&ViewCollection{}).GetBundleFolderName():                 func() BundleableGroup { return &ViewCollection{} },
	(&ThemeCollection{}).GetBundleFolderName():                func() BundleableGroup { return &ThemeCollection{} },
	(&CredentialCollection{}).GetBundleFolderName():           func() BundleableGroup { return &CredentialCollection{} },
	(&ComponentPackCollection{}).GetBundleFolderName():        func() BundleableGroup { return &ComponentPackCollection{} },
	(&ComponentVariantCollection{}).GetBundleFolderName():     func() BundleableGroup { return &ComponentVariantCollection{} },
	(&FeatureFlagCollection{}).GetBundleFolderName():          func() BundleableGroup { return &FeatureFlagCollection{} },
	(&LabelCollection{}).GetBundleFolderName():                func() BundleableGroup { return &LabelCollection{} },
	(&TranslationCollection{}).GetBundleFolderName():          func() BundleableGroup { return &TranslationCollection{} },
	(&AuthSourceCollection{}).GetBundleFolderName():           func() BundleableGroup { return &AuthSourceCollection{} },
	(&UserAccessTokenCollection{}).GetBundleFolderName():      func() BundleableGroup { return &UserAccessTokenCollection{} },
	(&SignupMethodCollection{}).GetBundleFolderName():         func() BundleableGroup { return &SignupMethodCollection{} },
	(&IntegrationCollection{}).GetBundleFolderName():          func() BundleableGroup { return &IntegrationCollection{} },
	(&IntegrationActionCollection{}).GetBundleFolderName():    func() BundleableGroup { return &IntegrationActionCollection{} },
	(&IntegrationTypeCollection{}).GetBundleFolderName():      func() BundleableGroup { return &IntegrationTypeCollection{} },
	(&ComponentCollection{}).GetBundleFolderName():            func() BundleableGroup { return &ComponentCollection{} },
	(&UtilityCollection{}).GetBundleFolderName():              func() BundleableGroup { return &UtilityCollection{} },
	(&RecordChallengeTokenCollection{}).GetBundleFolderName(): func() BundleableGroup { return &RecordChallengeTokenCollection{} },
	(&UserAccessTokenCollection{}).GetBundleFolderName():      func() BundleableGroup { return &UserAccessTokenCollection{} },
}

var bundleableCollectionNames = map[string]string{}

func init() {
	for metadataType, factory := range bundleableGroupMap {
		bundleableCollectionNames[factory().GetName()] = metadataType
	}
}

func IsNilGroupingValue(groupingValue interface{}) bool {
	switch v := groupingValue.(type) {
	case string:
		return v == ""
	case []string:
		return len(v) == 0
	case []interface{}:
		return len(v) == 0
	}
	return groupingValue == nil
}

const requiredGroupingValueError = "metadata type %s requires grouping value"

// A map of metadata types to the field that is required to be present in order to group.
// All types in requiredGroupingConditionFields REQUIRE a grouping condition field,
// whereas all types in optionalGroupingConditionFields do not.
var requiredGroupingConditionFields, optionalGroupingConditionFields map[string]string

func init() {
	requiredGroupingConditionFields = map[string]string{
		"fields":                "uesio/studio.collection",
		"integrationactions":    "uesio/studio.integrationtype",
		"recordchallengetokens": "uesio/studio.collection",
	}
	optionalGroupingConditionFields = map[string]string{
		"authsources":       "uesio/studio.authsource",
		"bots":              "uesio/studio.type",
		"componentvariants": "uesio/studio.component",
		"credentials":       "uesio/studio.type",
		"integrations":      "uesio/studio.type",
	}
}

func GetGroupingConditions(metadataType, grouping interface{}) (BundleConditions, error) {
	metadataTypeString, ok := metadataType.(string)
	if !ok {
		return nil, errors.New("metadata type must be a string")
	}
	// First check if this is metadata type has a required condition value
	if conditionField, isPresent := requiredGroupingConditionFields[metadataTypeString]; isPresent {
		if IsNilGroupingValue(grouping) {
			return nil, fmt.Errorf(requiredGroupingValueError, metadataType)
		} else {
			return BundleConditions{conditionField: grouping}, nil
		}
	}
	// Next check for optional condition values
	if conditionField, isPresent := optionalGroupingConditionFields[metadataTypeString]; isPresent && !IsNilGroupingValue(grouping) {
		return BundleConditions{conditionField: grouping}, nil
	}
	// Otherwise just return empty conditions
	return BundleConditions{}, nil
}

func GetBundleableGroupFromType(metadataType string) (BundleableGroup, error) {
	group, ok := bundleableGroupMap[metadataType]
	if !ok {
		return nil, errors.New("Bad metadata type: " + metadataType)
	}
	return group(), nil
}

func GetMetadataTypes() []string {
	return goutils.MapKeys(bundleableGroupMap)
}

func IsBundleableCollection(collectionName string) bool {
	return bundleableCollectionNames[collectionName] != ""
}

func IsCoreBundleableCollection(collectionName string) bool {
	swapped := SwapKeyNamespace(collectionName, "uesio/core", "uesio/studio")
	return bundleableCollectionNames[swapped] != ""
}

func GetTypeFromCollectionName(studioCollectionName string) string {
	return bundleableCollectionNames[studioCollectionName]
}

func Copy(to, from interface{}) error {
	return reprint.FromTo(from, to)
}

var validMetaRegex, _ = regexp.Compile("^[a-z0-9_-]+$")

func IsValidMetadataName(name string) bool {
	return validMetaRegex.MatchString(name)
}
