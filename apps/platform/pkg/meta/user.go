package meta

type User struct {
	BuiltIn     `yaml:",inline"`
	FirstName   string            `json:"uesio/core.firstname"`
	LastName    string            `json:"uesio/core.lastname"`
	Profile     string            `json:"uesio/core.profile"`
	Username    string            `json:"uesio/core.username"`
	Initials    string            `json:"uesio/core.initials"`
	Email       string            `json:"uesio/core.email"`
	Type        string            `json:"uesio/core.type"`
	Picture     *UserFileMetadata `json:"uesio/core.picture"`
	Language    string            `json:"uesio/core.language"`
	Permissions *PermissionSet    `json:"-"`
	ProfileRef  *Profile          `json:"-"`
}

func (u *User) GetProfileRef() *Profile {
	return u.ProfileRef
}

func (u *User) GetPicture() *UserFileMetadata {
	return u.Picture
}

func (u *User) GetPictureID() string {
	if u.Picture != nil {
		return u.Picture.ID
	}
	return ""
}

func (u *User) GetPictureUpdatedAt() int64 {
	if u.Picture != nil {
		return u.Picture.UpdatedAt
	}
	return 0
}

func (u *User) GetCollection() CollectionableGroup {
	return &UserCollection{}
}

func (u *User) GetCollectionName() string {
	return USER_COLLECTION_NAME
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

func (u *User) UnmarshalJSON(data []byte) error {
	type alias User
	return refScanner((*alias)(u), data)
}
