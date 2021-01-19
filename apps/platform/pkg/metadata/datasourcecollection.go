package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// DataSourceCollection slice
type DataSourceCollection []DataSource

// GetName function
func (dsc *DataSourceCollection) GetName() string {
	return "datasources"
}

// GetFields function
func (dsc *DataSourceCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(dsc)
}

// NewItem function
func (dsc *DataSourceCollection) NewItem() adapters.LoadableItem {
	return &DataSource{}
}

// NewBundleableItem function
func (dsc *DataSourceCollection) NewBundleableItem() BundleableItem {
	return &DataSource{}
}

// NewBundleableItem function
func (dsc *DataSourceCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewDataSource(key)
}

// GetKeyFromPath function
func (dsc *DataSourceCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// AddItem function
func (dsc *DataSourceCollection) AddItem(item adapters.LoadableItem) {
	*dsc = append(*dsc, *item.(*DataSource))
}

// GetItem function
func (dsc *DataSourceCollection) GetItem(index int) adapters.LoadableItem {
	return &(*dsc)[index]
}

// Loop function
func (dsc *DataSourceCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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
func (dsc *DataSourceCollection) Slice(start int, end int) error {
	return nil
}
