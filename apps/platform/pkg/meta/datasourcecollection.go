package meta

import (
	"strconv"
)

type DataSourceCollection []*DataSource

var DATASOURCE_COLLECTION_NAME = "uesio/studio.datasource"
var DATASOURCE_FOLDER_NAME = "datasources"

func (dsc *DataSourceCollection) GetName() string {
	return DATASOURCE_COLLECTION_NAME
}

func (dsc *DataSourceCollection) GetBundleFolderName() string {
	return DATASOURCE_FOLDER_NAME
}

func (dsc *DataSourceCollection) GetFields() []string {
	return StandardGetFields(&DataSource{})
}

func (dsc *DataSourceCollection) NewItem() Item {
	return &DataSource{}
}

func (dsc *DataSourceCollection) AddItem(item Item) {
	*dsc = append(*dsc, item.(*DataSource))
}

func (dsc *DataSourceCollection) GetItemFromPath(path string) BundleableItem {
	return &DataSource{Name: StandardNameFromPath(path)}
}

func (dsc *DataSourceCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (dsc *DataSourceCollection) GetItem(index int) Item {
	return (*dsc)[index]
}

func (dsc *DataSourceCollection) Loop(iter GroupIterator) error {
	for index := range *dsc {
		err := iter(dsc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (dsc *DataSourceCollection) Len() int {
	return len(*dsc)
}

func (dsc *DataSourceCollection) GetItems() interface{} {
	return *dsc
}
