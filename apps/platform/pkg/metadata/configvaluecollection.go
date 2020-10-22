package metadata

// ConfigValueCollection slice
type ConfigValueCollection []ConfigValue

// GetName function
func (cvc *ConfigValueCollection) GetName() string {
	return "configvalues"
}

// GetFields function
func (cvc *ConfigValueCollection) GetFields() []string {
	return []string{"id", "name", "type", "managedby"}
}

// NewItem function
func (cvc *ConfigValueCollection) NewItem() BundleableItem {
	var configValue ConfigValue
	return &configValue
}

// AddItem function
func (cvc *ConfigValueCollection) AddItem(item BundleableItem) {
	actual := *cvc
	configValue := item.(*ConfigValue)
	actual = append(actual, *configValue)
	*cvc = actual
}

// UnMarshal function
func (cvc *ConfigValueCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(cvc, data)
}

// Marshal function
func (cvc *ConfigValueCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(cvc)
}

// GetItem function
func (cvc *ConfigValueCollection) GetItem(index int) CollectionableItem {
	actual := *cvc
	return &actual[index]
}
