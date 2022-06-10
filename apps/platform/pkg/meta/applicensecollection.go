package meta

type AppLicenseCollection []*AppLicense

func (a *AppLicenseCollection) GetName() string {
	return "uesio/studio.applicences"
}
