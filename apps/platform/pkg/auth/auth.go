package auth

import (
	"errors"
	"os"
	"strings"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
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
	Verify(string, string, *sess.Session) error
	Decode(string, string, *sess.Session) (*AuthenticationClaims, error)
}

var authTypeMap = map[string]AuthenticationType{}

func getAuthType(authTypeName string) (AuthenticationType, error) {
	authType, ok := authTypeMap[authTypeName]
	if !ok {
		return nil, errors.New("auth type not found: " + authTypeName)
	}
	return authType, nil
}

// RegisterAuthType function
func RegisterAuthType(name string, authType AuthenticationType) {
	authTypeMap[name] = authType
}

// AuthenticationClaims struct
type AuthenticationClaims struct {
	Subject   string `json:"subject"`
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Email     string `json:"email"`
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

	bundleDef, err := bundle.GetSiteAppBundle(site)
	if err != nil {
		return nil, err
	}

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

// CreateUser function
func CreateUser(claims *AuthenticationClaims, site *meta.Site) error {

	// For now, just use a public session to do this.
	// We'll need to rethink this later when we add security to collections/wires
	session := sess.NewPublic(site)
	session.SetPermissions(&meta.PermissionSet{
		CollectionRefs: map[string]bool{
			"uesio/core.user": true,
		},
	})

	defaultSiteProfile := site.GetAppBundle().DefaultProfile

	if defaultSiteProfile == "" {
		defaultSiteProfile = "uesio/core.public"
	}

	return datasource.PlatformSaveOne(&meta.User{
		/*
			FederationType: claims.AuthType,
			FederationID:   claims.Subject,
		*/
		//Username: claims.Username,
		Profile: defaultSiteProfile,
	}, nil, nil, session)
}

/*
// ProvisionUser function
func ProvisionUser(claims *AuthenticationClaims, site *meta.Site) (*meta.User, error) {

	err := CreateUser(claims, site)
	if err != nil {
		return nil, err
	}

	user, err := GetUser(claims, site)
	if err != nil {
		return nil, err
	}

	if user == nil {
		return nil, errors.New("Failed Provisioning user Couldn't find it after creating")
	}

	return user, nil
}
*/

func GetUserByID(username string, session *sess.Session) (*meta.User, error) {
	var user meta.User

	err := datasource.PlatformLoadOne(
		&user,
		&datasource.PlatformLoadOptions{
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
					},
				},
				{
					ID: "uesio/core.language",
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: adapt.ID_FIELD,
					Value: username,
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

func getAuthMethod(session *sess.Session, key string) (*meta.AuthMethod, error) {
	authMethod, err := meta.NewAuthMethod(key)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(authMethod, session)

	if err != nil {
		return nil, err
	}

	return authMethod, nil
}

func GetLoginMethod(claims *AuthenticationClaims, authMethod *meta.AuthMethod, session *sess.Session) (*meta.LoginMethod, error) {

	var loginmethod meta.LoginMethod
	err := datasource.PlatformLoadOne(
		&loginmethod,
		&datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/core.auth_method",
					Value: authMethod.GetKey(),
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
			logger.Log("Could not find login method for claims: "+claims.Subject+":"+authMethod.ID, logger.INFO)
			return nil, nil
		}
		return nil, err
	}

	return &loginmethod, nil
}
