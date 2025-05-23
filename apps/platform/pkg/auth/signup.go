package auth

import (
	"regexp"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func mergeTemplate(payload map[string]any, usernameTemplate string) (string, error) {
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

func Signup(signupMethod *meta.SignupMethod, payload map[string]any, session *sess.Session) (*meta.User, error) {

	// If the Signup Method does not have self-signup enabled,
	// then block the request, unless we are in a Site Admin context
	if !signupMethod.EnableSelfSignup && session.GetSiteAdminSession() == nil {
		return nil, exceptions.NewForbiddenException("this site does not support self-signup")
	}

	return datasource.WithTransactionResult(session, nil, func(conn wire.Connection) (*meta.User, error) {
		return signupWithConnection(signupMethod, payload, conn, session)
	})

}

func signupWithConnection(signupMethod *meta.SignupMethod, payload map[string]any, connection wire.Connection, session *sess.Session) (*meta.User, error) {

	authconn, err := GetAuthConnection(signupMethod.AuthSource, connection, session)
	if err != nil {
		return nil, err
	}

	username, err := mergeTemplate(payload, signupMethod.UsernameTemplate)
	if err != nil {
		return nil, exceptions.NewBadRequestException("Signup failed - username not provided", nil)
	}

	if !matchesRegex(username, signupMethod.UsernameRegex) {
		return nil, exceptions.NewBadRequestException("Signup failed - username does not match required pattern: "+signupMethod.UsernameFormatExplanation, nil)
	}

	err = authconn.Signup(signupMethod, payload, username)
	if err != nil {
		return nil, err
	}

	return GetUserByKey(username, session, connection)
}

func ConfirmSignUp(systemSession *sess.Session, signupMethodID string, payload map[string]any, site *meta.Site) error {

	signupMethod, err := GetSignupMethod(signupMethodID, systemSession)
	if err != nil {
		return err
	}

	authconn, err := GetAuthConnection(signupMethod.AuthSource, nil, systemSession)
	if err != nil {
		return err
	}

	return authconn.ConfirmSignUp(signupMethod, payload)
}
