package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// FeatureFlagCollection slice
type FeatureFlagCollection []FeatureFlag

// GetName function
func (ffc *FeatureFlagCollection) GetName() string {
	return "uesio/studio.featureflag"
}

// GetFields function
func (ffc *FeatureFlagCollection) GetFields() []string {
	return StandardGetFields(&FeatureFlag{})
}

// NewItem function
func (ffc *FeatureFlagCollection) NewItem() loadable.Item {
	*ffc = append(*ffc, FeatureFlag{})
	return &(*ffc)[len(*ffc)-1]
}

// NewBundleableItemWithKey function
func (ffc *FeatureFlagCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	ff, err := NewFeatureFlag(key)
	if err != nil {
		return nil, err
	}
	*ffc = append(*ffc, *ff)
	return &(*ffc)[len(*ffc)-1], nil
}

// GetKeyFromPath function
func (ffc *FeatureFlagCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

// GetItem function
func (ffc *FeatureFlagCollection) GetItem(index int) loadable.Item {
	return &(*ffc)[index]
}

// Loop function
func (ffc *FeatureFlagCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *ffc {
		err := iter(ffc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (ffc *FeatureFlagCollection) Len() int {
	return len(*ffc)
}

// GetItems function
func (ffc *FeatureFlagCollection) GetItems() interface{} {
	return *ffc
}
