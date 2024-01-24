package meta

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/goutils"
)

type TypeGenerationOptions struct {
	// GenerateModuleForNamespace if true, then all typescriptable items in this group
	// will be wrapped inside a namespace-specific module, which will be created.
	// If false, then each TypescriptableItem must wrap itself in its own module.
	GenerateModuleForNamespace bool
	// GetTypescriptableItemConditions builds bundle conditions for use in filtering
	// all possible items to only include those which are "Typescriptable", meaning that
	// they have typescript type definitions
	GetTypescriptableItemConditions func() BundleConditions
}

type TypescriptableGroup interface {
	BundleableGroup
	// GetTypeGenerationOptions returns a struct that configures how type generation should be performed
	// for items of this type.
	GetTypeGenerationOptions() *TypeGenerationOptions
}

type TypescriptableItem interface {
	BundleableItem
	GenerateTypeDefinitions() (string, error)
}

type TypedGroupFactory func() TypescriptableGroup

func newTypeableGroup(groupInstance TypescriptableGroup, factory TypedGroupFactory) *TypeableGroup {
	return &TypeableGroup{
		BundleFolderName: groupInstance.GetBundleFolderName(),
		GroupName:        groupInstance.GetName(),
		Factory:          factory,
	}
}

type TypeableGroup struct {
	BundleFolderName string
	GroupName        string
	Factory          TypedGroupFactory
}

var typeableGroups = []*TypeableGroup{
	newTypeableGroup(&SelectListCollection{}, func() TypescriptableGroup { return &SelectListCollection{} }),
	newTypeableGroup(&BotCollection{}, func() TypescriptableGroup { return &BotCollection{} }),
}
var typeableCollectionNames = map[string]string{}

func init() {
	for _, group := range typeableGroups {
		typeableCollectionNames[group.GroupName] = group.BundleFolderName
	}
}

func GetMetadataTypesWithTypescriptDefinitions() []TypescriptableGroup {
	groups := make([]TypescriptableGroup, len(typeableGroups))
	for i, group := range typeableGroups {
		groups[i] = group.Factory()
	}
	return groups
}

// GetTypeNameFromMetaName returns a Typescript type name from a Uesio metadata item's name,
// by capitalizing each word (as distinguished by underscores),
// e.g. "release_platform" => "ReleasePlatform"
func GetTypeNameFromMetaName(name string) string {
	parts := strings.Split(name, "_")
	typeName := ""
	for _, p := range parts {
		typeName += goutils.Capitalize(p)
	}
	return typeName
}
