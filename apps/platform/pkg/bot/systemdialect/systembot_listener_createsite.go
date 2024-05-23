package systemdialect

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runCreateSiteListenerBot(params map[string]interface{}, connection wire.Connection, session *sess.Session) (map[string]interface{}, error) {

	firstName, err := getRequiredParameter(params, "firstname")
	if err != nil {
		return nil, err
	}

	lastName, err := getRequiredParameter(params, "lastname")
	if err != nil {
		return nil, err
	}

	username, err := getRequiredParameter(params, "username")
	if err != nil {
		return nil, err
	}
	username = strings.ToLower(username)

	email, err := getRequiredParameter(params, "email")
	if err != nil {
		return nil, err
	}

	subdomain, err := getRequiredParameter(params, "subdomain")
	if err != nil {
		return nil, err
	}

	siteName, err := getRequiredParameter(params, "site")
	if err != nil {
		return nil, err
	}

	appID, err := getRequiredParameter(params, "app")
	if err != nil {
		return nil, err
	}

	version, err := getRequiredParameter(params, "version")
	if err != nil {
		return nil, err
	}

	profile, err := getRequiredParameter(params, "profile")
	if err != nil {
		return nil, err
	}

	signupMethodName, err := getRequiredParameter(params, "signupmethod")
	if err != nil {
		return nil, err
	}

	app, err := datasource.QueryAppForWrite(appID, commonfields.UniqueKey, session, connection)
	if err != nil {
		return nil, exceptions.NewForbiddenException(fmt.Sprintf("you do not have permission to create bundles for app %s", appID))
	}

	major, minor, patch, err := meta.ParseVersionString(version)
	if err != nil {
		return nil, err
	}

	bundleUniqueKey := strings.Join([]string{appID, major, minor, patch}, ":")

	site := &meta.Site{
		Name: siteName,
		Bundle: &meta.Bundle{
			BuiltIn: meta.BuiltIn{
				UniqueKey: bundleUniqueKey,
			},
		},
		App: app,
	}

	domain := &meta.SiteDomain{
		Domain: subdomain,
		Type:   "subdomain",
		Site:   site,
	}

	user := &meta.User{
		FirstName: firstName,
		LastName:  lastName,
		Email:     email,
		Username:  username,
		Profile:   profile,
		Type:      "PERSON",
	}

	// First, create the site.
	err = datasource.PlatformSaveOne(site, nil, connection, session)
	if err != nil {
		return nil, err
	}

	// Second, create the domain.
	err = datasource.PlatformSaveOne(domain, nil, connection, session)
	if err != nil {
		return nil, err
	}

	siteAdminSession, err := datasource.AddSiteAdminContextByID(site.ID, session, connection)
	if err != nil {
		return nil, err
	}

	// Third, create the user.
	err = datasource.PlatformSaveOne(user, nil, connection, siteAdminSession)
	if err != nil {
		return nil, err
	}

	// Fourth, create a login method.
	signupMethod, err := auth.GetSignupMethod(signupMethodName, siteAdminSession)
	if err != nil {
		return nil, err
	}

	err = auth.CreateLoginWithConnection(signupMethod, map[string]interface{}{
		"username": username,
		"email":    email,
	}, connection, siteAdminSession)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{}, nil

}
