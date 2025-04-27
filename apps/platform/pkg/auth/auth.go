package auth

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"strings"

	"github.com/icza/session"

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

func init() {
	session.Global.Close()
	// The localhost check here is only necessary because hurl doesn't handle secure cookies against *.localhost by default like browsers, curl, etc.
	// do. If/When they treat "localhost" as a secure connection the IsLocalHost condition can be removed.
	// TODO: File an issue with hurl regarding this.  libcurl is returning the cookie to them, its in the response, but they are not carrying it
	// forward to subsequent requests.
	allowInsecureCookies := !tls.ServeAppWithTLS() && (env.IsLocalhost() || os.Getenv("UESIO_ALLOW_INSECURE_COOKIES") == "true")
	storageType := os.Getenv("UESIO_SESSION_STORE")

	var store session.Store
	switch storageType {
	case "filesystem":
		store = NewFSSessionStore()
	case "redis":
		store = NewRedisSessionStore()
	case "", "memory":
		store = session.NewInMemStore()
	default:
		panic("UESIO_SESSION_STORE is an unrecognized value: " + storageType)
	}

	options := &session.CookieMngrOptions{
		AllowHTTP: allowInsecureCookies,
	}

	session.Global = session.NewCookieManagerOptions(store, options)
}

type AuthenticationType interface {
	GetAuthConnection(*wire.Credentials, *meta.AuthSource, wire.Connection, *sess.Session) (AuthConnection, error)
}

type AuthConnection interface {
	Login(http.ResponseWriter, *http.Request)
	RequestLogin(http.ResponseWriter, *http.Request)
	Signup(*meta.SignupMethod, map[string]any, string) error
	ConfirmSignUp(*meta.SignupMethod, map[string]any) error
	ResetPassword(map[string]any, bool) (*meta.LoginMethod, error)
	ConfirmResetPassword(map[string]any) (*meta.User, error)
	CreateLogin(*meta.SignupMethod, map[string]any, *meta.User) error
}

func GetAuthConnection(authSourceID string, connection wire.Connection, session *sess.Session) (AuthConnection, error) {
	authSource, err := getAuthSource(authSourceID, session)
	if err != nil {
		return nil, err
	}

	// Enter into a version context to get these
	// credentails as the datasource's namespace
	versionSession, err := datasource.EnterVersionContext(authSource.Namespace, session, nil)
	if err != nil {
		return nil, err
	}

	authType, err := getAuthType(authSource.Type, versionSession)
	if err != nil {
		return nil, err
	}

	credentials, err := datasource.GetCredentials(authSource.Credentials, versionSession)
	if err != nil {
		return nil, err
	}

	return authType.GetAuthConnection(credentials, authSource, connection, session)
}

var authTypeMap = map[string]AuthenticationType{}

func getAuthType(authTypeName string, session *sess.Session) (AuthenticationType, error) {
	mergedType, err := configstore.Merge(authTypeName, session)
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

func GetSiteFromHost(host string) (*meta.Site, error) {

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
	site, err := getSiteFromDomain(domainType, domainValue)
	if err != nil {
		return nil, err
	}

	site.Domain = domain
	site.Subdomain = subdomain
	site.Scheme = tls.ServeAppDefaultScheme()

	bundleDef, err := bundle.GetSiteBundleDef(context.Background(), site, nil)
	if err != nil {
		return nil, err
	}

	licenseMap, err := datasource.GetLicenses(site.GetAppFullName(), nil)
	if err != nil {
		return nil, err
	}
	bundleDef.Licenses = licenseMap

	site.SetAppBundle(bundleDef)
	// Retain the full, original host, which may include things like a port which were ignored
	site.SetHost(host)

	return site, nil
}

func getSiteFromDomain(domainType, domainValue string) (*meta.Site, error) {

	// Get Cache site info for the host
	site, ok := getHostCache(domainType, domainValue)
	if ok {

		return site, nil
	}

	site, err := querySiteFromDomain(domainType, domainValue)
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

func CreateUser(signupMethod *meta.SignupMethod, user *meta.User, connection wire.Connection, session *sess.Session) (*meta.User, error) {
	user.Type = "PERSON"
	user.Profile = signupMethod.Profile
	if user.Language == "" {
		user.Language = "en"
	}

	err := datasource.PlatformSaveOne(user, nil, connection, session)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func getUser(field, value string, withPicture bool, session *sess.Session, connection wire.Connection) (*meta.User, error) {
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

func GetUserByKey(username string, session *sess.Session, connection wire.Connection) (*meta.User, error) {
	return getUser(commonfields.UniqueKey, username, false, session, connection)
}

func GetUserByID(id string, session *sess.Session, connection wire.Connection) (*meta.User, error) {
	return getUser(commonfields.Id, id, false, session, connection)
}

func GetUserWithPictureByID(id string, session *sess.Session, connection wire.Connection) (*meta.User, error) {
	return getUser(commonfields.Id, id, true, session, connection)
}

func getAuthSource(key string, session *sess.Session) (*meta.AuthSource, error) {
	authSource, err := meta.NewAuthSource(key)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(authSource, nil, session, nil)

	if err != nil {
		return nil, err
	}

	return authSource, nil
}

func GetSignupMethod(key string, session *sess.Session) (*meta.SignupMethod, error) {
	signupMethod, err := meta.NewSignupMethod(key)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(signupMethod, nil, session, nil)

	if err != nil {
		return nil, err
	}

	return signupMethod, nil
}

func getLoginMethod(value, field, authSourceID string, connection wire.Connection, session *sess.Session) (*meta.LoginMethod, error) {

	var loginMethod meta.LoginMethod
	err := datasource.PlatformLoadOne(
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
			slog.LogAttrs(session.Context(),
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

func GetLoginMethod(federationID string, authSourceID string, connection wire.Connection, session *sess.Session) (*meta.LoginMethod, error) {
	return getLoginMethod(federationID, "uesio/core.federation_id", authSourceID, connection, session)
}

func GetLoginMethodByUserID(userID string, authSourceID string, connection wire.Connection, session *sess.Session) (*meta.LoginMethod, error) {
	return getLoginMethod(userID, "uesio/core.user", authSourceID, connection, session)
}

func CreateLoginMethod(loginMethod *meta.LoginMethod, connection wire.Connection, session *sess.Session) error {
	return datasource.PlatformSaveOne(loginMethod, nil, connection, session)
}

func GetPayloadValue(payload map[string]any, key string) (string, error) {

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

func GetRequiredPayloadValue(payload map[string]any, key string) (string, error) {
	value, err := GetPayloadValue(payload, key)
	if err != nil {
		return "", err
	}
	if value == "" {
		return "", fmt.Errorf("missing required value: %s", key)
	}
	return value, nil
}
