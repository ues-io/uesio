package meta

import (
	"strconv"
)

type LicenseCollection []*License

func (lc *LicenseCollection) GetName() string {
	return "uesio/studio.license"
}

func (lc *LicenseCollection) GetFields() []string {
	return StandardGetFields(&License{})
}

func (lc *LicenseCollection) GetItem(index int) Item {
	return (*lc)[index]
}

func (lc *LicenseCollection) NewItem() Item {
	return &License{}
}

func (lc *LicenseCollection) AddItem(item Item) {
	*lc = append(*lc, item.(*License))
}

func (lc *LicenseCollection) Loop(iter GroupIterator) error {
	for index := range *lc {
		err := iter(lc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lc *LicenseCollection) Len() int {
	return len(*lc)
}

func (lc *LicenseCollection) GetItems() interface{} {
	return *lc
}
