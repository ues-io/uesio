package meta

import (
	"strconv"
)

type LicenseTemplateCollection []*LicenseTemplate

var LICENSETEMPLATE_COLLECTION_NAME = "uesio/studio.licensetemplate"
var LICENSETEMPLATE_FIELDS = StandardGetFields(&LicenseTemplate{})

func (ltc *LicenseTemplateCollection) GetName() string {
	return LICENSETEMPLATE_COLLECTION_NAME
}

func (ltc *LicenseTemplateCollection) GetFields() []string {
	return LICENSETEMPLATE_FIELDS
}

func (ltc *LicenseTemplateCollection) NewItem() Item {
	return &LicenseTemplate{}
}

func (ltc *LicenseTemplateCollection) AddItem(item Item) {
	*ltc = append(*ltc, item.(*LicenseTemplate))
}

func (ltc *LicenseTemplateCollection) Loop(iter GroupIterator) error {
	for index, lt := range *ltc {
		err := iter(lt, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ltc *LicenseTemplateCollection) Len() int {
	return len(*ltc)
}
