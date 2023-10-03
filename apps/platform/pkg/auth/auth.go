package auth

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
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
	GetAuthConnection(*adapt.Credentials) (AuthConnection, error)
}

type AuthConnection interface {
	Login(string, map[string]interface{}, *sess.Session) (*AuthenticationClaims, error)
	Signup(*meta.SignupMethod, map[string]interface{}, string, *sess.Session) (*AuthenticationClaims, error)
	ConfirmSignUp(string, map[string]interface{}, *sess.Session) error
	ForgotPassword(*meta.SignupMethod, map[string]interface{}, *sess.Session) error
	ConfirmForgotPassword(string, map[string]interface{}, *sess.Session) error
	CreateLogin(*meta.SignupMethod, map[string]interface{}, string, *sess.Session) (*AuthenticationClaims, error)
}

func GetAuthConnection(authSourceID string, session *sess.Session) (AuthConnection, error) {
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

	credentials, err := creds.GetCredentials(authSource.Credentials, versionSession)
	if err != nil {
		return nil, err
	}

	return authType.GetAuthConnection(credentials)
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

type AuthenticationClaims struct {
	Subject   string `json:"subject"`
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Email     string `json:"email"`
	Hash      string
	Code      string
	Verified  bool
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

func createUser(username string, email string, signupMethod *meta.SignupMethod) (*meta.User, error) {

	if signupMethod.Profile == "" {
		return nil, fmt.Errorf("signup method %s is missing the profile property", signupMethod.GetKey())
	}

	firstName, lastName := getNamePartsFromUsername(username)

	user := &meta.User{
		Username:  username,
		Profile:   signupMethod.Profile,
		Type:      "PERSON",
		Language:  "en",
		FirstName: goutils.Capitalize(firstName),
		LastName:  goutils.Capitalize(lastName),
	}

	if email != "" {
		user.Email = email
	}

	return user, nil
}

func getNamePartsFromUsername(username string) (first, last string) {
	if len(username) >= 3 {
		for _, sep := range []string{".", "_", "-"} {
			if strings.Contains(username, sep) {
				parts := strings.Split(username, sep)
				return parts[0], parts[1]
			}
		}
	}
	return username, username
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
					ID: "uesio/core.email",
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

func GetLoginMethod(claims *AuthenticationClaims, authSourceID string, session *sess.Session) (*meta.LoginMethod, error) {

	var loginmethod meta.LoginMethod
	err := datasource.PlatformLoadOne(
		&loginmethod,
		&datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/core.auth_source",
					Value: authSourceID,
				},
				{
					Field: "uesio/core.federation_id",
					Value: claims.Subject,
				},
			},
		},
		session,
	)
	if err != nil {
		if _, ok := err.(*datasource.RecordNotFoundError); ok {
			// User not found. No error though.
			logger.Log("Could not find login method for claims: "+claims.Subject+":"+authSourceID, logger.INFO)
			return nil, nil
		}
		return nil, err
	}

	return &loginmethod, nil
}

func CreateLoginMethod(user *meta.User, authSourceID string, claims *AuthenticationClaims, connection adapt.Connection, session *sess.Session) error {
	return datasource.PlatformSaveOne(&meta.LoginMethod{
		FederationID: claims.Subject,
		User:         user,
		AuthSource:   authSourceID,
		Hash:         claims.Hash,
		Code:         &meta.LoginMethodCode{Value: claims.Code, CreatedAt: time.Now().UnixNano()},
		Verified:     claims.Verified,
	}, nil, connection, session)
}

func GetPayloadValue(payload map[string]interface{}, key string) (string, error) {

	value, ok := payload[key]
	if !ok {
		return "", errors.New("Key: " + key + " not present in payload")
	}

	stringValue, ok := value.(string)
	if !ok {
		return "", errors.New("The value for" + key + " is not string")
	}

	return stringValue, nil

}

func GetRequiredPayloadValue(payload map[string]interface{}, key string) (string, error) {
	value, err := GetPayloadValue(payload, key)
	if err != nil {
		return "", err
	}
	if value == "" {
		return "", errors.New("Missing required payload value: " + key)
	}
	return value, nil
}

func boostPayloadWithTemplate(username string, payload map[string]interface{}, site *meta.Site, options *meta.EmailTemplateOptions) error {

	domain, err := datasource.QueryDomainFromSite(site.ID)
	if err != nil {
		return err
	}

	host := datasource.GetHostFromDomain(domain, site)

	link := fmt.Sprintf("%s/%s?code={####}&username=%s", host, options.Redirect, username)

	siteTitle := site.Title
	if siteTitle == "" {
		siteTitle = site.Name
	}

	templateMergeValues := map[string]interface{}{
		"app":       site.GetAppFullName(),
		"siteName":  site.Name,
		"siteTitle": siteTitle,
		"link":      link,
		"username":  username,
	}

	subjectTemplate, err := templating.NewTemplateWithValidKeysOnly(options.EmailSubject)
	if err != nil {
		return err
	}
	mergedSubject, err := templating.Execute(subjectTemplate, templateMergeValues)
	if err != nil {
		return err
	}

	bodyTemplate, err := templating.NewTemplateWithValidKeysOnly(options.EmailBody)
	if err != nil {
		return err
	}
	mergedBody, err := templating.Execute(bodyTemplate, templateMergeValues)
	if err != nil {
		return err
	}

	payload["subject"] = mergedSubject
	payload["message"] = mergedBody

	return nil
}
