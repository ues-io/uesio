package auth

import (
	"context"
	"errors"
	"log/slog"
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
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func init() {
	session.Global.Close()
	allowInsecureCookies := os.Getenv("UESIO_ALLOW_INSECURE_COOKIES")
	storageType := os.Getenv("UESIO_SESSION_STORE")

	var store session.Store
	if storageType == "filesystem" {
		store = NewFSSessionStore()
	} else if storageType == "redis" {
		store = NewRedisSessionStore()
	} else if storageType == "" {
		store = session.NewInMemStore()
	} else {
		panic("UESIO_SESSION_STORE is an unrecognized value: " + storageType)
	}

	options := &session.CookieMngrOptions{
		AllowHTTP: allowInsecureCookies == "true",
	}

	session.Global = session.NewCookieManagerOptions(store, options)
}

type AuthenticationType interface {
	GetAuthConnection(*wire.Credentials, *meta.AuthSource, wire.Connection, *sess.Session) (AuthConnection, error)
}

type AuthConnection interface {
	Login(map[string]interface{}) (*meta.User, error)
	Signup(*meta.SignupMethod, map[string]interface{}, string) error
	ConfirmSignUp(*meta.SignupMethod, map[string]interface{}) error
	ForgotPassword(*meta.SignupMethod, map[string]interface{}) error
	ConfirmForgotPassword(*meta.SignupMethod, map[string]interface{}) error
	CreateLogin(*meta.SignupMethod, map[string]interface{}, *meta.User) error
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
		return nil, errors.New("No adapter found of this auth type: " + mergedType)
	}
	return authType, nil
}

func RegisterAuthType(name string, authType AuthenticationType) {
	authTypeMap[name] = authType
}

func removePort(host string) string {
	return strings.Split(host, ":")[0]
}

func parseHost(host string) (string, string, string, bool) {

	primaryDomain := env.GetPrimaryDomain()
	hostWithoutPort := removePort(host)

	if hostWithoutPort == primaryDomain {
		return "domain", host, "", false
	}

	if strings.Contains(hostWithoutPort, "."+primaryDomain) {
		hostParts := strings.Split(host, ".")
		return "subdomain", hostParts[1] + "." + hostParts[2], hostParts[0], true
	}

	return "domain", host, "", false
}

func GetSiteFromHost(host string) (*meta.Site, error) {

	domainType, domain, subdomain, isSubDomain := parseHost(host)
	domainValue := removePort(domain)
	if isSubDomain {
		domainValue = subdomain
	}
	site, err := getSiteFromDomain(domainType, domainValue)
	if err != nil {
		return nil, err
	}

	site.Domain = domain
	site.Subdomain = subdomain

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
		return nil, errors.New("No Site Found: " + domainType + " : " + domainValue)
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

func getUser(field, value string, session *sess.Session, connection wire.Connection) (*meta.User, error) {
	var user meta.User
	err := datasource.PlatformLoadOne(
		&user,
		&datasource.PlatformLoadOptions{
			Connection: connection,
			Fields: []wire.LoadRequestField{
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
					ID: "uesio/core.picture",
					Fields: []wire.LoadRequestField{
						{
							ID: commonfields.Id,
						},
						{
							ID: commonfields.UpdatedAt,
						},
					},
				},
				{
					ID: "uesio/core.language",
				},
				{
					ID: "uesio/core.owner",
				},
			},
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
	return getUser(commonfields.UniqueKey, username, session, connection)
}

func GetUserByID(id string, session *sess.Session, connection wire.Connection) (*meta.User, error) {
	return getUser(commonfields.Id, id, session, connection)
}

func getAuthSource(key string, session *sess.Session) (*meta.AuthSource, error) {
	authSource, err := meta.NewAuthSource(key)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(authSource, session, nil)

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
	err = bundle.Load(signupMethod, session, nil)

	if err != nil {
		return nil, err
	}

	return signupMethod, nil
}

func getLoginMethod(value, field, authSourceID string, session *sess.Session) (*meta.LoginMethod, error) {

	var loginMethod meta.LoginMethod
	err := datasource.PlatformLoadOne(
		&loginMethod,
		&datasource.PlatformLoadOptions{
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

func GetLoginMethod(federationID string, authSourceID string, session *sess.Session) (*meta.LoginMethod, error) {
	return getLoginMethod(federationID, "uesio/core.federation_id", authSourceID, session)
}

func GetLoginMethodByUserID(userID string, authSourceID string, session *sess.Session) (*meta.LoginMethod, error) {
	return getLoginMethod(userID, "uesio/core.user", authSourceID, session)
}

func CreateLoginMethod(loginMethod *meta.LoginMethod, connection wire.Connection, session *sess.Session) error {
	return datasource.PlatformSaveOne(loginMethod, nil, connection, session)
}

func GetPayloadValue(payload map[string]interface{}, key string) (string, error) {

	value, ok := payload[key]
	if !ok {
		return "", errors.New("key '" + key + "' not present in payload")
	}

	stringValue, ok := value.(string)
	if !ok {
		return "", errors.New("The value for " + key + " is not a string")
	}

	return stringValue, nil

}

func GetRequiredPayloadValue(payload map[string]interface{}, key string) (string, error) {
	value, err := GetPayloadValue(payload, key)
	if err != nil {
		return "", err
	}
	if value == "" {
		return "", errors.New("missing required value: " + key)
	}
	return value, nil
}
