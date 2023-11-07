package meta

import (
	"errors"
	"fmt"
	"reflect"
	"regexp"
	"strings"
	"time"

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
	CreatedBy *User     `yaml:"-" json:"uesio/core.createdby"`
	Owner     *User     `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy *User     `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt int64     `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt int64     `yaml:"-" json:"uesio/core.createdat"`
}

func (bi *BuiltIn) SetModified(mod time.Time) {
	bi.UpdatedAt = mod.Unix()
}

func (bi *BuiltIn) GetItemMeta() *ItemMeta {
	return bi.itemMeta
}

func (bi *BuiltIn) SetItemMeta(itemMeta *ItemMeta) {
	bi.itemMeta = itemMeta
}

type BundleConditions map[string]string

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

type BundleableItem interface {
	CollectionableItem
	GetBundleFolderName() string
	GetPermChecker() *PermissionSet
	GetKey() string
	GetPath() string
	GetDBID(string) string
	SetNamespace(string)
	GetNamespace() string
	SetModified(time.Time)
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

func GetGroupingConditions(metadataType, grouping string) (BundleConditions, error) {
	conditions := BundleConditions{}
	if metadataType == "fields" {
		if grouping == "" {
			return nil, errors.New("metadata type fields requires grouping value")
		}
		conditions["uesio/studio.collection"] = grouping
	} else if metadataType == "bots" {
		conditions["uesio/studio.type"] = grouping
	} else if metadataType == "componentvariants" {
		conditions["uesio/studio.component"] = grouping
	} else if metadataType == "integrationactions" {
		if grouping == "" {
			return nil, errors.New("metadata type integration action requires grouping value")
		}
		conditions["uesio/studio.integration"] = grouping
	} else if metadataType == "recordchallengetokens" {
		if grouping == "" {
			return nil, errors.New("metadata type record challenge token requires grouping value")
		}
		conditions["uesio/studio.collection"] = grouping
	}
	return conditions, nil
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

func Copy(to, from interface{}) {
	reflect.Indirect(reflect.ValueOf(to)).Set(reflect.Indirect(reflect.ValueOf(from)))
}

var validMetaRegex, _ = regexp.Compile("^[a-z0-9_]+$")

func IsValidMetadataName(name string) bool {
	return validMetaRegex.MatchString(name)
}
