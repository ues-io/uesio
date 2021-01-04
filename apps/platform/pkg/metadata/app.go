package metadata

// App struct
type App struct {
	ID             string `uesio:"uesio.id"`
	Name           string `uesio:"uesio.name"`
	Description    string `uesio:"uesio.description"`
	Color          string `uesio:"uesio.color"`
	LoginRoute     string `uesio:"uesio.loginroute"`
	HomeRoute      string `uesio:"uesio.homeroute"`
	DefaultProfile string `uesio:"uesio.defaultprofile"`
	PublicProfile  string `uesio:"uesio.publicprofile"`
}

// GetCollectionName function
func (a *App) GetCollectionName() string {
	return a.GetCollection().GetName()
}

// GetCollection function
func (a *App) GetCollection() CollectionableGroup {
	var ac AppCollection
	return &ac
}

// SetField function
func (a *App) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(a, fieldName, value)
}

// GetField function
func (a *App) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(a, fieldName)
}
