package meta

import (
	"strconv"

	"github.com/francoispqt/gojay"
)

type FeatureFlagCollection []*FeatureFlag

var FEATUREFLAG_COLLECTION_NAME = "uesio/studio.featureflag"
var FEATUREFLAG_FOLDER_NAME = "featureflags"
var FEATUREFLAG_FIELDS = StandardGetFields(&FeatureFlag{})

func (ffc *FeatureFlagCollection) MarshalJSONArray(enc *gojay.Encoder) {
	for _, ff := range *ffc {
		enc.AddObject(ff)
	}
}

func (ffc *FeatureFlagCollection) IsNil() bool {
	return ffc == nil
}

func (ffc *FeatureFlagCollection) GetName() string {
	return FEATUREFLAG_COLLECTION_NAME
}

func (ffc *FeatureFlagCollection) GetBundleFolderName() string {
	return FEATUREFLAG_FOLDER_NAME
}

func (ffc *FeatureFlagCollection) GetFields() []string {
	return FEATUREFLAG_FIELDS
}

func (ffc *FeatureFlagCollection) NewItem() Item {
	return &FeatureFlag{}
}

func (ffc *FeatureFlagCollection) AddItem(item Item) error {
	*ffc = append(*ffc, item.(*FeatureFlag))
	return nil
}

func (ffc *FeatureFlagCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseFeatureFlag(namespace, StandardNameFromPath(path))
}

func (ffc *FeatureFlagCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewFeatureFlag(key)
}

func (ffc *FeatureFlagCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (ffc *FeatureFlagCollection) Loop(iter GroupIterator) error {
	for index, ff := range *ffc {
		err := iter(ff, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ffc *FeatureFlagCollection) Len() int {
	return len(*ffc)
}
