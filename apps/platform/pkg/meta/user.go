package meta

type User struct {
	ID        string            `json:"uesio/core.id"`
	UniqueKey string            `json:"uesio/core.uniquekey"`
	FirstName string            `json:"uesio/core.firstname"`
	LastName  string            `json:"uesio/core.lastname"`
	Profile   string            `json:"uesio/core.profile"`
	Username  string            `json:"uesio/core.username"`
	Initials  string            `json:"uesio/core.initials"`
	Email     string            `json:"uesio/core.email"`
	Type      string            `json:"uesio/core.type"`
	Picture   *UserFileMetadata `json:"uesio/core.picture"`
	Language  string            `json:"uesio/core.language"`
	itemMeta  *ItemMeta         `json:"-"`
	CreatedBy *User             `json:"uesio/core.createdby"`
	Owner     *User             `json:"uesio/core.owner"`
	UpdatedBy *User             `json:"uesio/core.updatedby"`
	UpdatedAt int64             `json:"uesio/core.updatedat"`
	CreatedAt int64             `json:"uesio/core.createdat"`
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
	return &UserCollection{}
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
