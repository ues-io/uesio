package metadata

// ComponentPackCollection slice
type ComponentPackCollection []ComponentPack

// GetName function
func (cpc *ComponentPackCollection) GetName() string {
	return "componentpacks"
}

// GetFields function
func (cpc *ComponentPackCollection) GetFields() []string {
	return []string{"id", "name", "workspaceid"}
}

// NewItem function
func (cpc *ComponentPackCollection) NewItem() BundleableItem {
	var componentPack ComponentPack
	return &componentPack
}

// AddItem function
func (cpc *ComponentPackCollection) AddItem(item BundleableItem) {
	actual := *cpc
	componentPack := item.(*ComponentPack)
	actual = append(actual, *componentPack)
	*cpc = actual
}

// UnMarshal function
func (cpc *ComponentPackCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(cpc, data)
}

// Marshal function
func (cpc *ComponentPackCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(cpc)
}

// GetItem function
func (cpc *ComponentPackCollection) GetItem(index int) CollectionableItem {
	actual := *cpc
	return &actual[index]
}
