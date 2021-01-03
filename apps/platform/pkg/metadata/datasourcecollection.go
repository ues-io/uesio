package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// DataSourceCollection slice
type DataSourceCollection []DataSource

// GetName function
func (dsc *DataSourceCollection) GetName() string {
	return "datasources"
}

// GetFields function
func (dsc *DataSourceCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(dsc)
}

// NewItem function
func (dsc *DataSourceCollection) NewItem() LoadableItem {
	return &DataSource{}
}

// NewBundleableItem function
func (dsc *DataSourceCollection) NewBundleableItem(key string) (BundleableItem, error) {
	return NewDataSource(key)
}

// GetKeyPrefix function
func (dsc *DataSourceCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (dsc *DataSourceCollection) AddItem(item LoadableItem) {
	*dsc = append(*dsc, *item.(*DataSource))
}

// GetItem function
func (dsc *DataSourceCollection) GetItem(index int) LoadableItem {
	actual := *dsc
	return &actual[index]
}

// Loop function
func (dsc *DataSourceCollection) Loop(iter func(item LoadableItem) error) error {
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
