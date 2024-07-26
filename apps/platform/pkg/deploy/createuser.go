package deploy

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/param"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type CreateUserOptions struct {
	SiteID       string `bot:"siteId"`
	FirstName    string `bot:"firstName"`
	LastName     string `bot:"lastName"`
	Username     string `bot:"username"`
	Email        string `bot:"email"`
	Profile      string `bot:"profile"`
	SignupMethod string `bot:"signupMethod"`
}

func NewCreateUserOptions(siteID string, params map[string]interface{}) (*CreateUserOptions, error) {
	firstName, err := param.GetRequiredString(params, "firstname")
	if err != nil {
		return nil, err
	}

	lastName, err := param.GetRequiredString(params, "lastname")
	if err != nil {
		return nil, err
	}

	username, err := param.GetRequiredString(params, "username")
	if err != nil {
		return nil, err
	}
	username = strings.ToLower(username)

	email, err := param.GetRequiredString(params, "email")
	if err != nil {
		return nil, err
	}

	profile, err := param.GetRequiredString(params, "profile")
	if err != nil {
		return nil, err
	}

	signupMethodName, err := param.GetRequiredString(params, "signupmethod")
	if err != nil {
		return nil, err
	}

	return &CreateUserOptions{
		FirstName:    firstName,
		LastName:     lastName,
		Username:     username,
		Email:        email,
		Profile:      profile,
		SignupMethod: signupMethodName,
		SiteID:       siteID,
	}, nil
}

func CreateUser(options *CreateUserOptions, connection wire.Connection, session *sess.Session) (*meta.User, error) {
	if options == nil {
		return nil, errors.New("Invalid Create options")
	}

	firstName := options.FirstName
	lastName := options.LastName
	username := options.Username
	email := options.Email
	profile := options.Profile
	signupMethodName := options.SignupMethod
	siteID := options.SiteID

	user := &meta.User{
		FirstName: firstName,
		LastName:  lastName,
		Email:     email,
		Username:  username,
		Profile:   profile,
		Type:      "PERSON",
	}

	siteAdminSession, err := datasource.AddSiteAdminContextByID(siteID, session, connection)
	if err != nil {
		return nil, err
	}

	// Third, create the user.
	err = datasource.PlatformSaveOne(user, nil, connection, siteAdminSession)
	if err != nil {
		return nil, err
	}

	// Fourth, create a login method.
	signupMethod, err := auth.GetSignupMethod(signupMethodName, siteAdminSession)
	if err != nil {
		return nil, err
	}

	err = auth.CreateLoginWithConnection(signupMethod, map[string]interface{}{
		"username": username,
		"email":    email,
	}, connection, siteAdminSession)
	if err != nil {
		return nil, err
	}

	return user, err
}
