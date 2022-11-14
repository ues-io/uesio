package meta

import (
	"strconv"
)

type LicenseTemplateCollection []*LicenseTemplate

func (ltc *LicenseTemplateCollection) GetName() string {
	return "uesio/studio.licensetemplate"
}

func (ltc *LicenseTemplateCollection) GetFields() []string {
	return StandardGetFields(&LicenseTemplate{})
}

func (ltc *LicenseTemplateCollection) GetItem(index int) Item {
	return (*ltc)[index]
}

func (ltc *LicenseTemplateCollection) NewItem() Item {
	return &LicenseTemplate{}
}

func (ltc *LicenseTemplateCollection) AddItem(item Item) {
	*ltc = append(*ltc, item.(*LicenseTemplate))
}

func (ltc *LicenseTemplateCollection) Loop(iter GroupIterator) error {
	for index := range *ltc {
		err := iter(ltc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ltc *LicenseTemplateCollection) Len() int {
	return len(*ltc)
}

func (ltc *LicenseTemplateCollection) GetItems() interface{} {
	return *ltc
}
