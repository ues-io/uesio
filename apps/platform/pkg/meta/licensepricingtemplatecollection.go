package meta

import (
	"strconv"
)

type LicensePricingTemplateCollection []*LicensePricingTemplate

var LICENSEPRICINGTEMPLATE_COLLECTION_NAME = "uesio/studio.licensepricingtemplate"
var LICENSEPRICINGTEMPLATE_FIELDS = StandardGetFields(&LicensePricingTemplate{})

func (ltc *LicensePricingTemplateCollection) GetName() string {
	return LICENSEPRICINGTEMPLATE_COLLECTION_NAME
}

func (ltc *LicensePricingTemplateCollection) GetFields() []string {
	return LICENSEPRICINGTEMPLATE_FIELDS
}

func (ltc *LicensePricingTemplateCollection) NewItem() Item {
	return &LicensePricingTemplate{}
}

func (ltc *LicensePricingTemplateCollection) AddItem(item Item) {
	*ltc = append(*ltc, item.(*LicensePricingTemplate))
}

func (ltc *LicensePricingTemplateCollection) Loop(iter GroupIterator) error {
	for index, lt := range *ltc {
		err := iter(lt, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ltc *LicensePricingTemplateCollection) Len() int {
	return len(*ltc)
}
