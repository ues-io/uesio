package meta

import (
	"strconv"
)

type DataSourceCollection []*DataSource

func (dsc *DataSourceCollection) GetName() string {
	return "uesio/studio.datasource"
}

func (dsc *DataSourceCollection) GetBundleFolderName() string {
	return "datasources"
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

func (dsc *DataSourceCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewDataSource(key)
}

func (dsc *DataSourceCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
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
