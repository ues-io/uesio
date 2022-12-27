package meta

import (
	"strconv"

	"github.com/francoispqt/gojay"
)

type FeatureFlagCollection []*FeatureFlag

var FEATUREFLAG_COLLECTION_NAME = "uesio/studio.featureflag"
var FEATUREFLAG_FOLDER_NAME = "featureflags"

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
	return StandardGetFields(&FeatureFlag{})
}

func (ffc *FeatureFlagCollection) NewItem() Item {
	return &FeatureFlag{}
}

func (ffc *FeatureFlagCollection) AddItem(item Item) {
	*ffc = append(*ffc, item.(*FeatureFlag))
}

func (ffc *FeatureFlagCollection) GetItemFromPath(path string) BundleableItem {
	return &FeatureFlag{Name: StandardNameFromPath(path)}
}

func (ffc *FeatureFlagCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
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
