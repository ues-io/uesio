package meta

// AppLicense struct
type AppLicense struct {
	ID             string
	AppRef         string
	LicensedAppRef string
}

// DefaultAppLicenses Seed config values (these are necessary to make things work)
var DefaultAppLicenses = AppLicenseCollection{
	{
		AppRef:         "crm",
		LicensedAppRef: "uesio",
	},
	{
		AppRef:         "crm",
		LicensedAppRef: "material",
	},
	{
		AppRef:         "crm",
		LicensedAppRef: "sample",
	},
	{
		AppRef:         "uesio",
		LicensedAppRef: "material",
	},
	{
		AppRef:         "studio",
		LicensedAppRef: "uesio",
	},
	{
		AppRef:         "studio",
		LicensedAppRef: "material",
	},
}
