package auth

import (
	"errors"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"regexp"

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

func Signup(signupMethodID string, payload map[string]interface{}, site *meta.Site) (*meta.SignupMethod, error) {

	session, err := GetSystemSession(site, nil)
	if err != nil {
		return nil, err
	}

	signupMethod, err := getSignupMethod(signupMethodID, session)
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

	err = boostPayloadWithTemplate(username, payload, site, &signupMethod.Signup)
	if err != nil {
		return nil, err
	}

	claims, err := authconn.Signup(payload, username, session)
	if err != nil {
		return nil, err
	}

	email, _ := GetPayloadValue(payload, "email")

	userMeta, err := createUser(username, email, signupMethod)
	if err != nil {
		return nil, err
	}

	err = datasource.PlatformSaveOne(userMeta, nil, nil, session)
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

func ConfirmSignUp(signupMethodID string, payload map[string]interface{}, site *meta.Site) error {

	session, err := GetSystemSession(site, nil)
	if err != nil {
		return err
	}

	signupMethod, err := getSignupMethod(signupMethodID, session)
	if err != nil {
		return err
	}

	authconn, err := GetAuthConnection(signupMethod.AuthSource, session)
	if err != nil {
		return err
	}

	return authconn.ConfirmSignUp(payload, session)
}
