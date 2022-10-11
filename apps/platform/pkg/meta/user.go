package meta

type User struct {
	ID        string            `uesio:"uesio/core.id"`
	UniqueKey string            `yaml:"-" uesio:"uesio/core.uniquekey"`
	FirstName string            `uesio:"uesio/core.firstname"`
	LastName  string            `uesio:"uesio/core.lastname"`
	Profile   string            `uesio:"uesio/core.profile"`
	Username  string            `uesio:"uesio/core.username"`
	Initials  string            `uesio:"uesio/core.initials"`
	Email     string            `uesio:"uesio/core.email"`
	Type      string            `uesio:"uesio/core.type"`
	Picture   *UserFileMetadata `uesio:"uesio/core.picture"`
	Language  string            `uesio:"uesio/core.language"`
	itemMeta  *ItemMeta         `yaml:"-" uesio:"-"`
	CreatedBy *User             `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User             `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User             `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64             `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64             `yaml:"-" uesio:"uesio/core.createdat"`
}

func (u *User) GetPictureID() string {
	if u.Picture != nil {
		return u.Picture.ID
	}
	return ""
}

func (u *User) GetCollectionName() string {
	return u.GetCollection().GetName()
}

func (u *User) GetCollection() CollectionableGroup {
	var uc UserCollection
	return &uc
}

func (u *User) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(u, fieldName, value)
}

func (u *User) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(u, fieldName)
}

func (u *User) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(u, iter)
}

func (u *User) Len() int {
	return StandardItemLen(u)
}

func (u *User) GetItemMeta() *ItemMeta {
	return u.itemMeta
}

func (u *User) SetItemMeta(itemMeta *ItemMeta) {
	u.itemMeta = itemMeta
}
