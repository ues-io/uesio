package auth

import (
	"errors"
	"regexp"

	"github.com/thecloudmasters/uesio/pkg/datasource"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func mergeTemplate(payload map[string]interface{}, usernameTemplate string) (string, error) {
	template, err := templating.NewTemplateWithValidKeysOnly(usernameTemplate)
	if err != nil {
		return "", err
	}
	return templating.Execute(template, payload)
}

func matchesRegex(usarname string, regex string) bool {
	if regex == "" {
		return meta.IsValidMetadataName(usarname)
	}
	var validMetaRegex, _ = regexp.Compile(regex)
	return validMetaRegex.MatchString(usarname)
}

func Signup(signupMethod *meta.SignupMethod, payload map[string]interface{}, session *sess.Session) (*meta.User, error) {
	connection, err := datasource.GetPlatformConnection(nil, session, nil)
	if err != nil {
		return nil, err
	}

	err = connection.BeginTransaction()
	if err != nil {
		return nil, err
	}

	user, err := signupWithConnection(signupMethod, payload, connection, session)
	if err != nil {
		rollbackError := connection.RollbackTransaction()
		if rollbackError != nil {
			return nil, rollbackError
		}
		return nil, err
	}

	err = connection.CommitTransaction()
	if err != nil {
		return nil, err
	}

	return user, nil
}

func signupWithConnection(signupMethod *meta.SignupMethod, payload map[string]interface{}, connection adapt.Connection, session *sess.Session) (*meta.User, error) {

	authconn, err := GetAuthConnection(signupMethod.AuthSource, session)
	if err != nil {
		return nil, err
	}

	username, err := mergeTemplate(payload, signupMethod.UsernameTemplate)
	if err != nil {
		return nil, err
	}

	if !matchesRegex(username, signupMethod.UsernameRegex) {
		return nil, errors.New("username does not match required pattern: " + signupMethod.UsernameFormatExplanation)
	}

	err = boostPayloadWithTemplate(username, payload, session.GetSite(), &signupMethod.Signup)
	if err != nil {
		return nil, err
	}

	claims, err := authconn.Signup(signupMethod, payload, username, session)
	if err != nil {
		return nil, err
	}

	email, _ := GetPayloadValue(payload, "email")

	userMeta, err := createUser(username, email, signupMethod)
	if err != nil {
		return nil, err
	}

	err = datasource.PlatformSaveOne(userMeta, nil, connection, session)
	if err != nil {
		return nil, err
	}

	user, err := GetUserByKey(username, session, connection)
	if err != nil {
		return nil, err
	}

	err = CreateLoginMethod(user, signupMethod.AuthSource, claims, connection, session)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func ConfirmSignUp(signupMethodID string, payload map[string]interface{}, site *meta.Site) error {

	session, err := GetSystemSession(site, nil)
	if err != nil {
		return err
	}

	signupMethod, err := GetSignupMethod(signupMethodID, session)
	if err != nil {
		return err
	}

	authconn, err := GetAuthConnection(signupMethod.AuthSource, session)
	if err != nil {
		return err
	}

	return authconn.ConfirmSignUp(signupMethod.AuthSource, payload, session)
}
