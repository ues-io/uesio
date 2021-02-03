package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// DataSourceCollection slice
type DataSourceCollection []DataSource

// GetName function
func (dsc *DataSourceCollection) GetName() string {
	return "datasources"
}

// GetFields function
func (dsc *DataSourceCollection) GetFields() []string {
	return StandardGetFields(&DataSource{})
}

// NewItem function
func (dsc *DataSourceCollection) NewItem() loadable.Item {
	*dsc = append(*dsc, DataSource{})
	return &(*dsc)[len(*dsc)-1]
}

// NewBundleableItemWithKey function
func (dsc *DataSourceCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	ds, err := NewDataSource(key)
	if err != nil {
		return nil, err
	}
	*dsc = append(*dsc, *ds)
	return &(*dsc)[len(*dsc)-1], nil
}

// GetKeyFromPath function
func (dsc *DataSourceCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// GetItem function
func (dsc *DataSourceCollection) GetItem(index int) loadable.Item {
	return &(*dsc)[index]
}

// Loop function
func (dsc *DataSourceCollection) Loop(iter func(item loadable.Item) error) error {
	for index := range *dsc {
		err := iter(dsc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (dsc *DataSourceCollection) Len() int {
	return len(*dsc)
}

// GetItems function
func (dsc *DataSourceCollection) GetItems() interface{} {
	return dsc
}

// Slice function
func (dsc *DataSourceCollection) Slice(start int, end int) {

}
