package meta

// User struct
type User struct {
	ID             string    `uesio:"uesio.id"`
	FirstName      string    `uesio:"uesio.firstname"`
	LastName       string    `uesio:"uesio.lastname"`
	Profile        string    `uesio:"uesio.profile"`
	FederationID   string    `uesio:"uesio.federationId"`
	FederationType string    `uesio:"uesio.federationType"`
	Site           string    `uesio:"uesio.site"`
	itemMeta       *ItemMeta `yaml:"-" uesio:"-"`
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

// SetField function
func (u *User) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(u, fieldName, value)
}

// GetField function
func (u *User) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(u, fieldName)
}

// Loop function
func (u *User) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(u, iter)
}

// GetItemMeta function
func (u *User) GetItemMeta() *ItemMeta {
	return u.itemMeta
}

// SetItemMeta function
func (u *User) SetItemMeta(itemMeta *ItemMeta) {
	u.itemMeta = itemMeta
}
