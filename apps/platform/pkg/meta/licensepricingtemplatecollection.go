package meta

import (
	"strconv"
)

type LicensePricingTemplateCollection []*LicensePricingTemplate

func (ltc *LicensePricingTemplateCollection) GetName() string {
	return "uesio/studio.licensepricingtemplate"
}

func (ltc *LicensePricingTemplateCollection) GetFields() []string {
	return StandardGetFields(&LicensePricingTemplate{})
}

func (ltc *LicensePricingTemplateCollection) GetItem(index int) Item {
	return (*ltc)[index]
}

func (ltc *LicensePricingTemplateCollection) NewItem() Item {
	return &LicensePricingTemplate{}
}

func (ltc *LicensePricingTemplateCollection) AddItem(item Item) {
	*ltc = append(*ltc, item.(*LicensePricingTemplate))
}

func (ltc *LicensePricingTemplateCollection) Loop(iter GroupIterator) error {
	for index := range *ltc {
		err := iter(ltc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ltc *LicensePricingTemplateCollection) Len() int {
	return len(*ltc)
}

func (ltc *LicensePricingTemplateCollection) GetItems() interface{} {
	return *ltc
}
