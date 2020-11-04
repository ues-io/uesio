package metadata

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

// AddItem function
func (dsc *DataSourceCollection) AddItem(item BundleableItem) {
	actual := *dsc
	datasource := item.(*DataSource)
	actual = append(actual, *datasource)
	*dsc = actual
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
