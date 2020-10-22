package metadata

// SecretCollection slice
type SecretCollection []Secret

// GetName function
func (sc *SecretCollection) GetName() string {
	return "secrets"
}

// GetFields function
func (sc *SecretCollection) GetFields() []string {
	return []string{"id", "name", "type", "managedby"}
}

// NewItem function
func (sc *SecretCollection) NewItem() BundleableItem {
	var secret Secret
	return &secret
}

// AddItem function
func (sc *SecretCollection) AddItem(item BundleableItem) {
	actual := *sc
	secret := item.(*Secret)
	actual = append(actual, *secret)
	*sc = actual
}

// UnMarshal function
func (sc *SecretCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(sc, data)
}

// Marshal function
func (sc *SecretCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(sc)
}

// GetItem function
func (sc *SecretCollection) GetItem(index int) CollectionableItem {
	actual := *sc
	return &actual[index]
}
