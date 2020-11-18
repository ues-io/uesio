package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// App struct
type App struct {
	ID             string `uesio:"uesio.id"`
	Name           string `uesio:"uesio.name"`
	Description    string `uesio:"uesio.description"`
	Color          string `uesio:"uesio.color"`
	LoginRoute     string `uesio:"uesio.loginRoute"`
	HomeRoute      string `uesio:"uesio.homeRoute"`
	DefaultProfile string `uesio:"uesio.defaultProfile"`
	PublicProfile  string `uesio:"uesio.publicProfile"`
}

// GetCollectionName function
func (a *App) GetCollectionName() string {
	return a.GetCollection().GetName()
}

// GetKey function
func (a *App) GetKey() string {
	return a.Name
}

// GetCollection function
func (a *App) GetCollection() CollectionableGroup {
	var ac AppCollection
	return &ac
}

// GetConditions function
func (a *App) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: a.Name,
		},
	}, nil
}

// SetNamespace function
func (a *App) SetNamespace(namespace string) {

}

// GetNamespace function
func (a *App) GetNamespace() string {
	return ""
}

// SetWorkspace function
func (a *App) SetWorkspace(workspace string) {

}
