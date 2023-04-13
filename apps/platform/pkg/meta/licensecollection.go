package meta

import (
	"strconv"
)

type LicenseCollection []*License

var LICENSE_COLLECTION_NAME = "uesio/studio.license"
var LICENSE_FIELDS = StandardGetFields(&License{})

func (lc *LicenseCollection) GetName() string {
	return LICENSE_COLLECTION_NAME
}

func (lc *LicenseCollection) GetFields() []string {
	return LICENSE_FIELDS
}

func (lc *LicenseCollection) NewItem() Item {
	return &License{}
}

func (lc *LicenseCollection) AddItem(item Item) error {
	*lc = append(*lc, item.(*License))
	return nil
}

func (lc *LicenseCollection) Loop(iter GroupIterator) error {
	for index, l := range *lc {
		err := iter(l, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lc *LicenseCollection) Len() int {
	return len(*lc)
}
