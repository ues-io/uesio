package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type UserAPI struct {
	user *meta.User
}

func NewUserAPI(user *meta.User) *UserAPI {
	return &UserAPI{
		user,
	}
}

func (u *UserAPI) GetId() string {
	return u.user.ID
}

func (u *UserAPI) GetUniqueKey() string {
	return u.user.UniqueKey
}

func (u *UserAPI) GetEmail() string {
	return u.user.Email
}

func (u *UserAPI) GetUsername() string {
	return u.user.Username
}

func (u *UserAPI) GetFirstName() string {
	return u.user.FirstName
}

func (u *UserAPI) GetLastName() string {
	return u.user.LastName
}
