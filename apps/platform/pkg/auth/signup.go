package auth

import (
	"context"
	"regexp"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func mergeTemplate(payload AuthRequest, usernameTemplate string) (string, error) {
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

func Signup(ctx context.Context, signupMethod *meta.SignupMethod, payload AuthRequest, session *sess.Session) (*meta.User, error) {

	// If the Signup Method does not have self-signup enabled,
	// then block the request, unless we are in a Site Admin context
	if !signupMethod.EnableSelfSignup && session.GetSiteAdminSession() == nil {
		return nil, exceptions.NewForbiddenException("this site does not support self-signup")
	}

	return datasource.WithTransactionResult(ctx, session, nil, func(conn wire.Connection) (*meta.User, error) {
		return signupWithConnection(ctx, signupMethod, payload, conn, session)
	})

}

func signupWithConnection(ctx context.Context, signupMethod *meta.SignupMethod, payload AuthRequest, connection wire.Connection, session *sess.Session) (*meta.User, error) {

	authconn, err := GetAuthConnection(ctx, signupMethod.AuthSource, connection, session)
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

	err = authconn.Signup(ctx, signupMethod, payload, username)
	if err != nil {
		return nil, err
	}

	return GetUserByKey(ctx, username, session, connection)
}

func ConfirmSignUp(ctx context.Context, systemSession *sess.Session, signupMethodID string, payload AuthRequest, site *meta.Site) error {

	signupMethod, err := GetSignupMethod(ctx, signupMethodID, systemSession)
	if err != nil {
		return err
	}

	authconn, err := GetAuthConnection(ctx, signupMethod.AuthSource, nil, systemSession)
	if err != nil {
		return err
	}

	return authconn.ConfirmSignUp(ctx, signupMethod, payload)
}
