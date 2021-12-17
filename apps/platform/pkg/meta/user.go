package meta

// User struct
type User struct {
	ID             string            `uesio:"uesio.id"`
	FirstName      string            `uesio:"uesio.firstname"`
	LastName       string            `uesio:"uesio.lastname"`
	Profile        string            `uesio:"uesio.profile"`
	FederationID   string            `uesio:"uesio.federation_id"`
	FederationType string            `uesio:"uesio.federation_type"`
	Picture        *UserFileMetadata `uesio:"uesio.picture"`
	Language       string            `uesio:"uesio.language"`
	itemMeta       *ItemMeta         `yaml:"-" uesio:"-"`
	CreatedBy      *User             `yaml:"-" uesio:"uesio.createdby"`
	Owner          *User             `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy      *User             `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt      int64             `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt      int64             `yaml:"-" uesio:"uesio.createdat"`
}

func (u *User) GetPictureID() string {
	if u.Picture != nil {
		return u.Picture.ID
	}
	return ""
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

// Len function
func (u *User) Len() int {
	return StandardItemLen(u)
}

// GetItemMeta function
func (u *User) GetItemMeta() *ItemMeta {
	return u.itemMeta
}

// SetItemMeta function
func (u *User) SetItemMeta(itemMeta *ItemMeta) {
	u.itemMeta = itemMeta
}
