package meta

import (
	"strconv"

	"github.com/francoispqt/gojay"
)

type FeatureFlagCollection []*FeatureFlag

func (ffc *FeatureFlagCollection) MarshalJSONArray(enc *gojay.Encoder) {
	for _, ff := range *ffc {
		enc.AddObject(ff)
	}
}

func (ffc *FeatureFlagCollection) IsNil() bool {
	return ffc == nil
}

func (ffc *FeatureFlagCollection) GetName() string {
	return "uesio/studio.featureflag"
}

func (ffc *FeatureFlagCollection) GetBundleFolderName() string {
	return "featureflags"
}

func (ffc *FeatureFlagCollection) GetFields() []string {
	return StandardGetFields(&FeatureFlag{})
}

func (ffc *FeatureFlagCollection) NewItem() Item {
	ff := &FeatureFlag{}
	*ffc = append(*ffc, ff)
	return ff
}

func (ffc *FeatureFlagCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	ff, err := NewFeatureFlag(key)
	if err != nil {
		return nil, err
	}
	*ffc = append(*ffc, ff)
	return ff, nil
}

func (ffc *FeatureFlagCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (ffc *FeatureFlagCollection) GetItem(index int) Item {
	return (*ffc)[index]
}

func (ffc *FeatureFlagCollection) Loop(iter GroupIterator) error {
	for index := range *ffc {
		err := iter(ffc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ffc *FeatureFlagCollection) Len() int {
	return len(*ffc)
}

func (ffc *FeatureFlagCollection) GetItems() interface{} {
	return *ffc
}
