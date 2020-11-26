package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// DataSourceCollection slice
type DataSourceCollection []DataSource

// GetName function
func (dsc *DataSourceCollection) GetName() string {
	return "datasources"
}

// GetFields function
func (dsc *DataSourceCollection) GetFields() []string {
	return []string{"id", "name", "type", "region", "url", "database", "username", "password"}
}

// NewItem function
func (dsc *DataSourceCollection) NewItem(key string) (BundleableItem, error) {
	return NewDataSource(key)
}

// GetKeyPrefix function
func (dsc *DataSourceCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (dsc *DataSourceCollection) AddItem(item CollectionableItem) {
	*dsc = append(*dsc, *item.(*DataSource))
}

// UnMarshal function
func (dsc *DataSourceCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(dsc, data)
}

// Marshal function
func (dsc *DataSourceCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(dsc)
}

// GetItem function
func (dsc *DataSourceCollection) GetItem(index int) CollectionableItem {
	actual := *dsc
	return &actual[index]
}

// Loop function
func (dsc *DataSourceCollection) Loop(iter func(item CollectionableItem) error) error {
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
