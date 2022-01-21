package auth

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// AuthenticationType interface
type AuthenticationType interface {
	Verify(string, *sess.Session) error
	Decode(string, *sess.Session) (*AuthenticationClaims, error)
}

var authTypeMap = map[string]AuthenticationType{}

func getAuthType(authTypeName string) (AuthenticationType, error) {
	authType, ok := authTypeMap[authTypeName]
	if !ok {
		return nil, errors.New("No adapter found of this type: " + authTypeName)
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
	AuthType  string `json:"authType"`
	Email     string `json:"email"`
}

func parseHost(host string) (domainType, domainValue, domain, subdomain string) {
	stringParts := strings.Split(host, ".")
	if len(stringParts) == 3 {
		return "subdomain", stringParts[0], stringParts[1] + "." + stringParts[2], stringParts[0]
	}
	hostParts := strings.Split(host, ":")
	return "domain", hostParts[0], host, ""
}

// GetSiteFromHost function
func GetSiteFromHost(host string) (*meta.Site, error) {

	domainType, domainValue, domain, subdomain := parseHost(host)
	// Get Cache site info for the host
	site, ok := getHostCache(domainType, domainValue)
	if ok {
		site.Domain = domain
		site.Subdomain = subdomain
		return site, nil
	}

	site, err := GetSiteFromDomain(domainType, domainValue)
	if err != nil {
		return nil, err
	}
	if site == nil {
		return nil, errors.New("No Site Found: " + domainType + " : " + domain)
	}
	site.Domain = domain
	site.Subdomain = subdomain

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

	defaultSiteProfile := site.GetAppBundle().DefaultProfile

	if defaultSiteProfile == "" {
		defaultSiteProfile = "uesio.public"
	}

	return datasource.PlatformSaveOne(&meta.User{
		FirstName:      claims.FirstName,
		LastName:       claims.LastName,
		FederationType: claims.AuthType,
		FederationID:   claims.Subject,
		Profile:        defaultSiteProfile,
	}, nil, session)
}

// CheckProvisionWhitelist function
func CheckProvisionWhitelist(claims *AuthenticationClaims, site *meta.Site) error {

	email := claims.Email
	emailSplit := strings.Split(email, "@")

	if len(emailSplit) != 2 {
		return errors.New("Invalid Email Address")
	}

	domain := emailSplit[1]

	emailWhitelist := map[string]bool{
		"humanbenh@gmail.com":   true,
		"plusplusben@gmail.com": true,
	}

	domainWhitelist := map[string]bool{
		"thecloudmasters.com": true,
		"uesio.com":           true,
		"tfbnw.net":           true,
		"ues.io":              true,
	}

	_, emailOk := emailWhitelist[email]

	_, domainOk := domainWhitelist[domain]

	if emailOk || domainOk {
		return nil
	}
	return errors.New("You're not on the list, sorry. :(")
}

// ProvisionUser function
func ProvisionUser(claims *AuthenticationClaims, site *meta.Site) (*meta.User, error) {

	err := CheckProvisionWhitelist(claims, site)
	if err != nil {
		return nil, err
	}

	err = CreateUser(claims, site)
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

// GetUser function
func GetUser(claims *AuthenticationClaims, site *meta.Site) (*meta.User, error) {

	// For now, just use a public session to do this.
	// We'll need to rethink this later when we add security to collections/wires
	session := sess.NewPublic(site)

	var user meta.User
	err := datasource.PlatformLoadOne(
		&user,
		[]adapt.LoadRequestCondition{
			{
				Field: "uesio.federation_type",
				Value: claims.AuthType,
			},
			{
				Field: "uesio.federation_id",
				Value: claims.Subject,
			},
		},
		session,
	)
	if err != nil {
		if _, ok := err.(*datasource.RecordNotFoundError); ok {
			// User not found. No error though.
			logger.Log("Could not find user: "+claims.Subject, logger.INFO)
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}
