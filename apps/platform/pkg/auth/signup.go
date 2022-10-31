package auth

import (
	"errors"
	"regexp"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
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

func Signup(namespace, name string, payload map[string]interface{}, site *meta.Site) (*meta.SignupMethod, error) {

	signupMethod := &meta.SignupMethod{
		Name:      name,
		Namespace: namespace,
	}

	session, err := GetSystemSession(site, nil)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(signupMethod, session)
	if err != nil {
		return nil, err
	}

	authconn, err := GetAuthConnection(signupMethod.AuthSource, session)
	if err != nil {
		return nil, err
	}

	username, err := mergeTemplate(payload, signupMethod.UsernameTemplate)
	if err != nil {
		return nil, err
	}

	if !matchesRegex(username, signupMethod.UsernameRegex) {
		return nil, errors.New("Signup failed: Regex validation failed")
	}

	claims, err := authconn.Signup(payload, username, session)
	if err != nil {
		return nil, err
	}

	email, _ := GetPayloadValue(payload, "email")

	err = CreateUser(username, email, signupMethod, session)
	if err != nil {
		return nil, err
	}

	user, err := GetUserByKey(username, session, nil)
	if err != nil {
		return nil, err
	}

	err = CreateLoginMethod(user, signupMethod, claims, session)
	if err != nil {
		return nil, err
	}

	return signupMethod, nil
}

func ConfirmSignUp(authSourceID string, payload map[string]interface{}, session *sess.Session) error {
	conn, err := GetAuthConnection(authSourceID, session)
	if err != nil {
		return err
	}

	return conn.ConfirmSignUp(payload, session)
}
