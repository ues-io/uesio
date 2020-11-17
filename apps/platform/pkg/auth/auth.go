package auth

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/site"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// AuthenticationType interface
type AuthenticationType interface {
	Verify(string, *metadata.Site) error
	Decode(string, *metadata.Site) (*AuthenticationClaims, error)
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
	Subject   string
	FirstName string
	LastName  string
	AuthType  string
	Email     string
}

// GetSiteFromHost function
func GetSiteFromHost(host string) (*metadata.Site, error) {
	var domainType, domain string
	stringParts := strings.Split(host, ".")
	if len(stringParts) == 3 {
		domainType = "subdomain"
		domain = stringParts[0]
	} else {
		domainType = "domain"
		hostParts := strings.Split(host, ":")
		domain = hostParts[0] // Strip off the port
	}
	site, err := site.GetSiteFromDomain(domainType, domain)
	if err != nil {
		return nil, err
	}
	if site == nil {
		return nil, errors.New("No Site Found: " + domainType + " : " + domain)
	}
	return site, nil
}

// CreateUser function
func CreateUser(claims *AuthenticationClaims, site *metadata.Site) error {

	// For now, just use a public session to do this.
	// We'll need to rethink this later when we add security to collections/wires
	session := sess.NewPublic(site)

	// Get the site's default profile (hardcoding for now)
	defaultSiteProfile := "uesio.standard"

	_, err := datasource.PlatformSave([]datasource.PlatformSaveRequest{
		{
			Collection: &metadata.UserCollection{
				{
					FirstName:      claims.FirstName,
					LastName:       claims.LastName,
					FederationType: claims.AuthType,
					FederationID:   claims.Subject,
					Profile:        defaultSiteProfile,
					Site:           site.Name,
				},
			},
		},
	}, session)
	return err
}

// CheckProvisionWhitelist function
func CheckProvisionWhitelist(claims *AuthenticationClaims, site *metadata.Site) error {

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
	}

	_, emailOk := emailWhitelist[email]

	_, domainOk := domainWhitelist[domain]

	if emailOk || domainOk {
		return nil
	}
	return errors.New("You're not on the list, sorry. :(")
}

// ProvisionUser function
func ProvisionUser(claims *AuthenticationClaims, site *metadata.Site) (*metadata.User, error) {

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
func GetUser(claims *AuthenticationClaims, site *metadata.Site) (*metadata.User, error) {

	// For now, just use a public session to do this.
	// We'll need to rethink this later when we add security to collections/wires
	session := sess.NewPublic(site)

	var user metadata.User
	err := datasource.PlatformLoadOne(
		&user,
		[]reqs.LoadRequestCondition{
			{
				Field: "uesio.federationType",
				Value: claims.AuthType,
			},
			{
				Field: "uesio.federationId",
				Value: claims.Subject,
			},
			{
				Field: "uesio.site",
				Value: site.Name,
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
