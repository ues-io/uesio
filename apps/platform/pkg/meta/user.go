package meta

// User struct
type User struct {
	ID        string            `uesio:"uesio/uesio.id"`
	FirstName string            `uesio:"uesio/uesio.firstname"`
	LastName  string            `uesio:"uesio/uesio.lastname"`
	Profile   string            `uesio:"uesio/uesio.profile"`
	Username  string            `uesio:"uesio/uesio.username"`
	Initials  string            `uesio:"uesio/uesio.initials"`
	Type      string            `uesio:"uesio/uesio.type"`
	Picture   *UserFileMetadata `uesio:"uesio/uesio.picture"`
	Language  string            `uesio:"uesio/uesio.language"`
	itemMeta  *ItemMeta         `yaml:"-" uesio:"-"`
	CreatedBy *User             `yaml:"-" uesio:"uesio/uesio.createdby"`
	Owner     *User             `yaml:"-" uesio:"uesio/uesio.owner"`
	UpdatedBy *User             `yaml:"-" uesio:"uesio/uesio.updatedby"`
	UpdatedAt int64             `yaml:"-" uesio:"uesio/uesio.updatedat"`
	CreatedAt int64             `yaml:"-" uesio:"uesio/uesio.createdat"`
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
