package meta

import (
	"strconv"
)

type DataSourceCollection []*DataSource

var DATASOURCE_COLLECTION_NAME = "uesio/studio.datasource"
var DATASOURCE_FOLDER_NAME = "datasources"
var DATASOURCE_FIELDS = StandardGetFields(&DataSource{})

func (dsc *DataSourceCollection) GetName() string {
	return DATASOURCE_COLLECTION_NAME
}

func (dsc *DataSourceCollection) GetBundleFolderName() string {
	return DATASOURCE_FOLDER_NAME
}

func (dsc *DataSourceCollection) GetFields() []string {
	return DATASOURCE_FIELDS
}

func (dsc *DataSourceCollection) NewItem() Item {
	return &DataSource{}
}

func (dsc *DataSourceCollection) AddItem(item Item) error {
	*dsc = append(*dsc, item.(*DataSource))
	return nil
}

func (dsc *DataSourceCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseDataSource(namespace, StandardNameFromPath(path))
}

func (dsc *DataSourceCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (dsc *DataSourceCollection) Loop(iter GroupIterator) error {
	for index, ds := range *dsc {
		err := iter(ds, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (dsc *DataSourceCollection) Len() int {
	return len(*dsc)
}
