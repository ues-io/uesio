package metadata

// RouteCollection slice
type RouteCollection []Route

// GetName function
func (rc *RouteCollection) GetName() string {
	return "routes"
}

// GetFields function
func (rc *RouteCollection) GetFields() []string {
	return []string{"id", "name", "path", "workspaceid", "view"}
}

// NewItem function
func (rc *RouteCollection) NewItem() BundleableItem {
	var route Route
	return &route
}

// AddItem function
func (rc *RouteCollection) AddItem(item BundleableItem) {
	actual := *rc
	route := item.(*Route)
	actual = append(actual, *route)
	*rc = actual
}

// UnMarshal function
func (rc *RouteCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(rc, data)
}

// Marshal function
func (rc *RouteCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(rc)
}

// GetItem function
func (rc *RouteCollection) GetItem(index int) CollectionableItem {
	actual := *rc
	return &actual[index]
}
