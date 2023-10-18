package auth

import (
	"regexp"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
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

	authconn, err := GetAuthConnection(signupMethod.AuthSource, connection, session)
	if err != nil {
		return nil, err
	}

	username, err := mergeTemplate(payload, signupMethod.UsernameTemplate)
	if err != nil {
		return nil, NewAuthRequestError("Signup failed - username not provided")
	}

	if !matchesRegex(username, signupMethod.UsernameRegex) {
		return nil, NewAuthRequestError("Signup failed - username does not match required pattern: " + signupMethod.UsernameFormatExplanation)
	}

	err = authconn.Signup(signupMethod, payload, username)
	if err != nil {
		return nil, err
	}

	return GetUserByKey(username, session, connection)
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

	authconn, err := GetAuthConnection(signupMethod.AuthSource, nil, session)
	if err != nil {
		return err
	}

	return authconn.ConfirmSignUp(signupMethod, payload)
}
