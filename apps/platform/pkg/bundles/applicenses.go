package bundles

import "github.com/thecloudmasters/uesio/pkg/metadata"

//TODO:: JAS Add licensing as a thing
func GetAppLicense(app, appToCheck string) (*metadata.AppLicense, error) {
	for _, av := range metadata.DefaultAppLicenses {
		if av.AppRef == app && av.LicensedAppRef == appToCheck {
			return &av, nil
		}
	}
	return nil, nil
}
