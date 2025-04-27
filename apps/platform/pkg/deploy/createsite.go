package deploy

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/param"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type CreateSiteOptions struct {
	AppName   string `bot:"appName"`
	SiteName  string `bot:"siteName"`
	Subdomain string `bot:"subdomain"`
	Version   string `bot:"version"`
}

func NewCreateSiteOptions(params map[string]any) (*CreateSiteOptions, error) {

	subdomain, err := param.GetRequiredString(params, "subdomain")
	if err != nil {
		return nil, err
	}

	siteName, err := param.GetRequiredString(params, "site")
	if err != nil {
		return nil, err
	}

	appName, err := param.GetRequiredString(params, "app")
	if err != nil {
		return nil, err
	}

	version, err := param.GetRequiredString(params, "version")
	if err != nil {
		return nil, err
	}

	return &CreateSiteOptions{
		AppName:   appName,
		SiteName:  siteName,
		Subdomain: subdomain,
		Version:   version,
	}, nil
}

func CreateSite(options *CreateSiteOptions, connection wire.Connection, session *sess.Session) (*meta.Site, error) {

	if options == nil {
		return nil, errors.New("invalid create options")
	}

	appName := options.AppName
	siteName := options.SiteName
	subdomain := options.Subdomain
	version := options.Version

	app, err := datasource.QueryAppForWrite(appName, commonfields.UniqueKey, session, connection)
	if err != nil {
		return nil, exceptions.NewForbiddenException("you do not have permission to create bundles for app " + appName)
	}

	major, minor, patch, err := meta.ParseVersionString(version)
	if err != nil {
		return nil, err
	}

	bundleUniqueKey := strings.Join([]string{appName, major, minor, patch}, ":")

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

	return site, nil

}
