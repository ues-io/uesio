package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// User struct
type User struct {
	ID             string `uesio:"-"`
	FirstName      string `uesio:"uesio.firstname"`
	LastName       string `uesio:"uesio.lastname"`
	Profile        string `uesio:"uesio.profile"`
	FederationID   string `uesio:"uesio.federationId"`
	FederationType string `uesio:"uesio.federationType"`
	Site           string `uesio:"uesio.site"`
}

// GetCollectionName function
func (u *User) GetCollectionName() string {
	return u.GetCollection().GetName()
}

// GetCollection function
func (u *User) GetCollection() CollectionableGroup {
	var uc UserCollection
	return &uc
}

// GetConditions function
func (u *User) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: u.ID,
		},
	}, nil
}

// GetKey function
func (u *User) GetKey() string {
	return u.ID
}

// GetNamespace function
func (u *User) GetNamespace() string {
	return ""
}

// SetNamespace function
func (u *User) SetNamespace(namespace string) {

}

// SetWorkspace function
func (u *User) SetWorkspace(workspace string) {

}
