package meta

type TypescriptableGroup interface {
	BundleableGroup
	// GetTypescriptableItemConditions builds bundle conditions for use in filtering
	// all possible items to only include those which are "Typescriptable", meaning that
	// they have typescript type definitions
	GetTypescriptableItemConditions() BundleConditions
}

type TypescriptableItem interface {
	AttachableItem
	GenerateTypeDefinitions() (string, error)
}

type TypedGroupFactory func() TypescriptableGroup

var typeableGroupMap = map[string]TypedGroupFactory{
	(&BotCollection{}).GetBundleFolderName(): func() TypescriptableGroup { return &BotCollection{} },
}
var typeableCollectionNames = map[string]string{}

func init() {
	for metadataType, factory := range typeableGroupMap {
		typeableCollectionNames[factory().GetName()] = metadataType
	}
}

func GetMetadataTypesWithTypescriptDefinitions() map[string]TypescriptableGroup {
	m := map[string]TypescriptableGroup{}
	for k, v := range typeableGroupMap {
		m[k] = v()
	}
	return m
}
