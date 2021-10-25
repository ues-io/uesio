package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// FeatureFlagCollection slice
type FeatureFlagCollection []FeatureFlag

// GetName function
func (cvc *FeatureFlagCollection) GetName() string {
	return "studio.FeatureFlags"
}

// GetFields function
func (cvc *FeatureFlagCollection) GetFields() []string {
	return StandardGetFields(&FeatureFlag{})
}

// NewItem function
func (cvc *FeatureFlagCollection) NewItem() loadable.Item {
	*cvc = append(*cvc, FeatureFlag{})
	return &(*cvc)[len(*cvc)-1]
}

// NewBundleableItemWithKey function
func (cvc *FeatureFlagCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	cv, err := NewFeatureFlag(key)
	if err != nil {
		return nil, err
	}
	*cvc = append(*cvc, *cv)
	return &(*cvc)[len(*cvc)-1], nil
}

// GetKeyFromPath function
func (cvc *FeatureFlagCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// GetItem function
func (cvc *FeatureFlagCollection) GetItem(index int) loadable.Item {
	return &(*cvc)[index]
}

// Loop function
func (cvc *FeatureFlagCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *cvc {
		err := iter(cvc.GetItem(index), index)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (cvc *FeatureFlagCollection) Len() int {
	return len(*cvc)
}

// GetItems function
func (cvc *FeatureFlagCollection) GetItems() interface{} {
	return *cvc
}

// Slice function
func (cvc *FeatureFlagCollection) Slice(start int, end int) {

}
func (bc *FeatureFlagCollection) Filter(iter func(item loadable.Item) (bool, error)) error {
	return nil
}
