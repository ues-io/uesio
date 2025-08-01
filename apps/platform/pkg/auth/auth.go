package auth

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"strings"

	"github.com/crewjam/saml"
	"github.com/crewjam/saml/samlsp"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/tls"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type AuthRequest = map[string]any

type AuthResult struct {
	User        *meta.User
	LoginMethod *meta.LoginMethod
}

type LoginResult struct {
	AuthResult
	PasswordReset bool
}

type AuthenticationType interface {
	GetAuthConnection(*wire.Credentials, *meta.AuthSource, wire.Connection, *sess.Session) (AuthConnection, error)
}

type AuthConnection interface {
	Login(context.Context, AuthRequest) (*LoginResult, error)
	GetServiceProvider(*http.Request) (*samlsp.Middleware, error)
	// Explicit method for assertion login vs just creating an AuthRequest and sending to Login because
	// of the dynamic nature of our calls to "Login". In theory, it's all converted to strings so the type
	// assertion to Assertion would fail but this ensures we only get Assertions from SP's that have validated
	// them and not through any POST operation that might flow through /login.
	LoginServiceProvider(context.Context, *saml.Assertion) (*LoginResult, error)
	LoginCLI(context.Context, AuthRequest) (*LoginResult, error)
	Signup(context.Context, *meta.SignupMethod, AuthRequest, string) error
	ConfirmSignUp(context.Context, *meta.SignupMethod, AuthRequest) error
	ResetPassword(context.Context, AuthRequest, bool) (*meta.LoginMethod, error)
	ConfirmResetPassword(context.Context, AuthRequest) (*meta.User, error)
	CreateLogin(context.Context, *meta.SignupMethod, AuthRequest, *meta.User) error
}

func GetAuthConnection(ctx context.Context, authSourceID string, connection wire.Connection, session *sess.Session) (AuthConnection, error) {
	authSource, err := getAuthSource(ctx, authSourceID, session)
	if err != nil {
		return nil, err
	}

	// Enter into a version context to get these
	// credentials as the datasource's namespace
	versionSession, err := datasource.EnterVersionContext(ctx, authSource.Namespace, session, nil)
	if err != nil {
		return nil, err
	}

	authType, err := getAuthType(ctx, authSource.Type, versionSession)
	if err != nil {
		return nil, err
	}

	credentials, err := datasource.GetCredentials(ctx, authSource.Credentials, versionSession)
	if err != nil {
		return nil, err
	}

	return authType.GetAuthConnection(credentials, authSource, connection, session)
}

var authTypeMap = map[string]AuthenticationType{}

func getAuthType(ctx context.Context, authTypeName string, session *sess.Session) (AuthenticationType, error) {
	mergedType, err := configstore.Merge(ctx, authTypeName, session)
	if err != nil {
		return nil, err
	}
	authType, ok := authTypeMap[mergedType]
	if !ok {
		return nil, fmt.Errorf("no adapter found of this auth type: %s", mergedType)
	}
	return authType, nil
}

func RegisterAuthType(name string, authType AuthenticationType) {
	authTypeMap[name] = authType
}

func removePort(host string) (string, string, error) {
	if !strings.Contains(host, ":") {
		return host, "", nil
	}
	return net.SplitHostPort(host)
}

// returns domainType, domain, subdomain, isSubDomain, error
func parseHost(host string) (string, string, string, bool, error) {

	primaryDomain := env.GetPrimaryDomain()
	hostWithoutPort, hostPort, err := removePort(host)
	if err != nil {
		return "", "", "", false, err
	}

	if hostWithoutPort == primaryDomain {
		return "domain", host, "", false, nil
	}

	// TODO: The previous code made some assumptions that if there was
	// a subdomain, it would only be a single segment and that it would
	// never contain the primary domain in the subdomain segment (e.g.,
	// foo.uesio-dev.nottheprimarydomain.com).  Adjusting to find the
	// full subdomain based on the known primary domain for now.  However,
	// this approach still has limitations in terms of how we handle
	// finding "sites" throughout the entire code base.  This needs to
	// be adjusted throughout and determine what value we will store for a site
	// (e.g., entire hostname, only the full subdomain, etc.) and then adjust
	// this as needed.  For now, this will handle backwards compat and also
	// the localhost case.
	subdomain, ok := strings.CutSuffix(hostWithoutPort, "."+primaryDomain)
	if ok {
		domainWithPort := primaryDomain
		if hostPort != "" {
			domainWithPort += ":" + hostPort
		}
		return "subdomain", domainWithPort, subdomain, true, nil
	}

	return "domain", host, "", false, nil
}

func GetSiteFromHost(ctx context.Context, host string) (*meta.Site, error) {

	domainType, domain, subdomain, isSubDomain, err := parseHost(host)
	if err != nil {
		return nil, err
	}
	domainValue, _, err := removePort(domain)
	if err != nil {
		return nil, err
	}
	if isSubDomain {
		domainValue = subdomain
	}
	site, err := getSiteFromDomain(ctx, domainType, domainValue)
	if err != nil {
		return nil, err
	}

	site.Domain = domain
	site.Subdomain = subdomain
	site.Scheme = tls.ServeAppDefaultScheme()

	bundleDef, err := bundle.GetSiteBundleDef(ctx, site, nil)
	if err != nil {
		return nil, err
	}

	licenseMap, err := datasource.GetLicenses(ctx, site.GetAppFullName(), nil)
	if err != nil {
		return nil, err
	}
	bundleDef.Licenses = licenseMap

	site.SetAppBundle(bundleDef)
	// Retain the full, original host, which may include things like a port which were ignored
	site.SetHost(host)

	return site, nil
}

func getSiteFromDomain(ctx context.Context, domainType, domainValue string) (*meta.Site, error) {

	// Get Cache site info for the host
	site, ok := getHostCache(ctx, domainType, domainValue)
	if ok {

		return site, nil
	}

	site, err := querySiteFromDomain(ctx, domainType, domainValue)
	if err != nil {
		return nil, err
	}
	if site == nil {
		return nil, fmt.Errorf("no site found: %s : %s", domainType, domainValue)
	}

	err = setHostCache(domainType, domainValue, site)
	if err != nil {
		return nil, err
	}

	return site, nil
}

func CreateUser(ctx context.Context, signupMethod *meta.SignupMethod, user *meta.User, connection wire.Connection, session *sess.Session) (*meta.User, error) {
	user.Type = "PERSON"
	user.Profile = signupMethod.Profile
	if user.Language == "" {
		user.Language = "en"
	}

	err := datasource.PlatformSaveOne(ctx, user, nil, connection, session)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func getUser(ctx context.Context, field, value string, withPicture bool, session *sess.Session, connection wire.Connection) (*meta.User, error) {
	var user meta.User
	fields := []wire.LoadRequestField{
		{
			ID: "uesio/core.firstname",
		},
		{
			ID: "uesio/core.lastname",
		},
		{
			ID: "uesio/core.username",
		},
		{
			ID: "uesio/core.profile",
		},
		{
			ID: "uesio/core.email",
		},
		{
			ID: "uesio/core.language",
		},
		{
			ID: "uesio/core.owner",
			Fields: []wire.LoadRequestField{
				{
					ID: commonfields.Id,
				},
			},
		},
	}
	if withPicture {
		fields = append(fields, wire.LoadRequestField{
			ID: "uesio/core.picture",
			Fields: []wire.LoadRequestField{
				{
					ID: commonfields.Id,
				},
				{
					ID: commonfields.UpdatedAt,
				},
			},
		})
	}
	err := datasource.PlatformLoadOne(
		ctx,
		&user,
		&datasource.PlatformLoadOptions{
			Connection: connection,
			WireName:   "AuthGetUser",
			Fields:     fields,
			Conditions: []wire.LoadRequestCondition{
				{
					Field: field,
					Value: value,
				},
			},
		},
		session,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func GetUserByKey(ctx context.Context, username string, session *sess.Session, connection wire.Connection) (*meta.User, error) {
	return getUser(ctx, commonfields.UniqueKey, username, false, session, connection)
}

func GetUserByID(ctx context.Context, id string, session *sess.Session, connection wire.Connection) (*meta.User, error) {
	return getUser(ctx, commonfields.Id, id, false, session, connection)
}

func GetUserWithPictureByID(ctx context.Context, id string, session *sess.Session, connection wire.Connection) (*meta.User, error) {
	return getUser(ctx, commonfields.Id, id, true, session, connection)
}

func getAuthSource(ctx context.Context, key string, session *sess.Session) (*meta.AuthSource, error) {
	authSource, err := meta.NewAuthSource(key)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(ctx, authSource, nil, session, nil)

	if err != nil {
		return nil, err
	}

	return authSource, nil
}

func GetSignupMethod(ctx context.Context, key string, session *sess.Session) (*meta.SignupMethod, error) {
	signupMethod, err := meta.NewSignupMethod(key)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(ctx, signupMethod, nil, session, nil)

	if err != nil {
		return nil, err
	}

	return signupMethod, nil
}

func getLoginMethod(ctx context.Context, value, field, authSourceID string, connection wire.Connection, session *sess.Session) (*meta.LoginMethod, error) {

	var loginMethod meta.LoginMethod
	err := datasource.PlatformLoadOne(
		ctx,
		&loginMethod,
		&datasource.PlatformLoadOptions{
			WireName: "AuthGetLoginMethod",
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/core.federation_id",
				},
				{
					ID: "uesio/core.auth_source",
				},
				{
					ID: "uesio/core.user",
					Fields: []wire.LoadRequestField{
						{
							ID: commonfields.Id,
						},
					},
				},
				{
					ID: "uesio/core.hash",
				},
				{
					ID: "uesio/core.verification_code",
				},
				{
					ID: "uesio/core.verification_expires",
				},
				{
					ID: "uesio/core.signup_method",
				},
				{
					ID: "uesio/core.force_reset",
				},
				{
					ID: "uesio/core.temporary_password",
				},
			},
			Conditions: []wire.LoadRequestCondition{
				{
					Field: "uesio/core.auth_source",
					Value: authSourceID,
				},
				{
					Field: field,
					Value: value,
				},
			},
			Connection: connection,
		},
		session,
	)
	if err != nil {
		if exceptions.IsNotFoundException(err) {
			// Login method not found. Log as a warning.
			slog.LogAttrs(ctx,
				slog.LevelWarn,
				"Could not find login method",
				slog.String(field, value),
				slog.String("authSourceId", authSourceID))
			return nil, nil
		}
		return nil, err
	}

	return &loginMethod, nil
}

func GetLoginMethod(ctx context.Context, federationID string, authSourceID string, connection wire.Connection, session *sess.Session) (*meta.LoginMethod, error) {
	return getLoginMethod(ctx, federationID, "uesio/core.federation_id", authSourceID, connection, session)
}

func GetLoginMethodByUserID(ctx context.Context, userID string, authSourceID string, connection wire.Connection, session *sess.Session) (*meta.LoginMethod, error) {
	return getLoginMethod(ctx, userID, "uesio/core.user", authSourceID, connection, session)
}

func CreateLoginMethod(ctx context.Context, loginMethod *meta.LoginMethod, connection wire.Connection, session *sess.Session) error {
	return datasource.PlatformSaveOne(ctx, loginMethod, nil, connection, session)
}

func GetPayloadValue(payload AuthRequest, key string) (string, error) {

	value, ok := payload[key]
	if !ok {
		return "", fmt.Errorf("key '%s' not present in payload", key)
	}

	stringValue, ok := value.(string)
	if !ok {
		return "", fmt.Errorf("the value for %s is not a string", key)
	}

	return stringValue, nil

}

func GetRequiredPayloadValue(payload AuthRequest, key string) (string, error) {
	value, err := GetPayloadValue(payload, key)
	if err != nil {
		return "", err
	}
	if value == "" {
		return "", fmt.Errorf("missing required value: %s", key)
	}
	return value, nil
}

func GetUserFromFederationID(ctx context.Context, authSourceID string, federationID string, connection wire.Connection, session *sess.Session) (*meta.User, *meta.LoginMethod, error) {

	if session.GetWorkspace() != nil {
		return nil, nil, exceptions.NewBadRequestException("login isn't currently supported for workspaces", nil)
	}

	adminSession := sess.GetAnonSessionFrom(session)

	// 4. Check for Existing User
	loginMethod, err := GetLoginMethod(ctx, federationID, authSourceID, connection, adminSession)
	if err != nil {
		return nil, nil, fmt.Errorf("failed getting login method data: %w", err)
	}

	if loginMethod == nil {
		return nil, nil, exceptions.NewNotFoundException("no account found with this login method")
	}

	user, err := GetUserByID(ctx, loginMethod.User.ID, adminSession, nil)
	if err != nil {
		return nil, nil, exceptions.NewNotFoundException("failed getting user data: " + err.Error())
	}

	return user, loginMethod, nil
}
