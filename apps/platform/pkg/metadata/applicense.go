package metadata

// AppLicense struct
type AppLicense struct {
	ID             string
	AppRef         string
	LicensedAppRef string
}

// Seed config values (these are necessary to make things work)
var defaultAppLicenses = AppLicenseCollection{
	{
		AppRef:         "crm",
		LicensedAppRef: "uesio",
	},
}

// GetAppLicense key
func GetAppLicense(app, appToCheck string) (*AppLicense, error) {
	for _, av := range defaultAppLicenses {
		if av.AppRef == app && av.LicensedAppRef == appToCheck {
			return &av, nil
		}
	}
	return nil, nil
}
