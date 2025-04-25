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
	Password     string `bot:"password"`
	SetTemporary bool   `bot:"setTemporary"`
	ForceReset   bool   `bot:"forceReset"`
}

func NewCreateUserOptions(siteID string, params map[string]any) (*CreateUserOptions, error) {
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
		Password:     param.GetOptionalString(params, "password", ""),
		SetTemporary: param.GetBoolean(params, "setTemporary"),
		ForceReset:   param.GetBoolean(params, "forceReset"),
	}, nil
}

func CreateUser(options *CreateUserOptions, connection wire.Connection, session *sess.Session) (*meta.User, error) {
	if options == nil {
		return nil, errors.New("Invalid Create options")
	}

	user := &meta.User{
		FirstName: options.FirstName,
		LastName:  options.LastName,
		Email:     options.Email,
		Username:  options.Username,
		Profile:   options.Profile,
		Type:      "PERSON",
	}

	siteAdminSession, err := datasource.AddSiteAdminContextByID(options.SiteID, session, connection)
	if err != nil {
		return nil, err
	}

	// Third, create the user.
	err = datasource.PlatformSaveOne(user, nil, connection, siteAdminSession)
	if err != nil {
		return nil, err
	}

	// Fourth, create a login method.
	signupMethod, err := auth.GetSignupMethod(options.SignupMethod, siteAdminSession)
	if err != nil {
		return nil, err
	}

	err = auth.CreateLoginWithConnection(signupMethod, map[string]any{
		"username":     options.Username,
		"email":        options.Email,
		"password":     options.Password,
		"setTemporary": options.SetTemporary,
		"forceReset":   options.ForceReset,
	}, connection, siteAdminSession)
	if err != nil {
		return nil, err
	}

	return user, err
}
