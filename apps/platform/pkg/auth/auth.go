package auth

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"strings"

	"github.com/icza/session"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
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
	GetAuthConnection(*adapt.Credentials, *meta.AuthSource, adapt.Connection, *sess.Session) (AuthConnection, error)
}

type AuthConnection interface {
	Login(map[string]interface{}) (*meta.User, error)
	Signup(*meta.SignupMethod, map[string]interface{}, string) error
	ConfirmSignUp(*meta.SignupMethod, map[string]interface{}) error
	ForgotPassword(*meta.SignupMethod, map[string]interface{}) error
	ConfirmForgotPassword(*meta.SignupMethod, map[string]interface{}) error
	CreateLogin(*meta.SignupMethod, map[string]interface{}, *meta.User) error
}

func GetAuthConnection(authSourceID string, connection adapt.Connection, session *sess.Session) (AuthConnection, error) {
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

func parseHost(host string) (domainType, domainValue, domain, subdomain string) {
	stringParts := strings.Split(host, ".")
	if len(stringParts) == 3 {
		// Example: ben.ues.io
		return "subdomain", stringParts[0], stringParts[1] + "." + stringParts[2], stringParts[0]
	}
	//
	hostParts := strings.Split(host, ":")
	return "domain", hostParts[0], host, ""
}

func GetSiteFromHost(host string) (*meta.Site, error) {
	domainType, domainValue, domain, subdomain := parseHost(host)
	site, err := getSiteFromDomain(domainType, domainValue)
	if err != nil {
		return nil, err
	}

	site.Domain = domain
	site.Subdomain = subdomain

	bundleDef, err := bundle.GetSiteBundleDef(site, nil)
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

func CreateUser(signupMethod *meta.SignupMethod, user *meta.User, connection adapt.Connection, session *sess.Session) (*meta.User, error) {
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

func getUser(field, value string, session *sess.Session, connection adapt.Connection) (*meta.User, error) {
	var user meta.User
	err := datasource.PlatformLoadOne(
		&user,
		&datasource.PlatformLoadOptions{
			Connection: connection,
			Fields: []adapt.LoadRequestField{
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
					Fields: []adapt.LoadRequestField{
						{
							ID: adapt.ID_FIELD,
						},
						{
							ID: adapt.UPDATED_AT_FIELD,
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
			Conditions: []adapt.LoadRequestCondition{
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

func GetUserByKey(username string, session *sess.Session, connection adapt.Connection) (*meta.User, error) {
	return getUser(adapt.UNIQUE_KEY_FIELD, username, session, connection)
}

func GetUserByID(id string, session *sess.Session, connection adapt.Connection) (*meta.User, error) {
	return getUser(adapt.ID_FIELD, id, session, connection)
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
			Conditions: []adapt.LoadRequestCondition{
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
		if _, ok := err.(*datasource.RecordNotFoundError); ok {
			// Login method not found. Log as a warning.
			slog.LogAttrs(context.Background(),
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

func CreateLoginMethod(loginMethod *meta.LoginMethod, connection adapt.Connection, session *sess.Session) error {
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
