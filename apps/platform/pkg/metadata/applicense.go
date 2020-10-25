package metadata

// AppLicense struct
type AppLicense struct {
	ID             string
	AppRef         string
	LicensedAppRef string
}

// Seed config values (these are necessary to make things work)
var DefaultAppLicenses = AppLicenseCollection{
	{
		AppRef:         "crm",
		LicensedAppRef: "uesio",
	},
}

