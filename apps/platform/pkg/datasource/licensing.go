package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type LicenseMap map[string]*meta.License

var licenseCache cache.Cache[LicenseMap]

func init() {
	licenseCache = cache.NewRedisCache[LicenseMap]("license")
}

func InvalidateLicenseCaches(namespaces []string) error {
	return licenseCache.Del(namespaces...)
}

func setLicenseCache(namespace string, licenses LicenseMap) error {
	return licenseCache.Set(namespace, licenses)
}

func getLicenseCache(namespace string) (LicenseMap, bool) {
	licenses, err := licenseCache.Get(namespace)
	if err != nil {
		return nil, false
	}
	if licenses == nil {
		return nil, false
	}
	return licenses, true
}

func GetLicenses(namespace string, connection adapt.Connection) (LicenseMap, error) {
	// Hardcode the license for uesio/core
	// This prevents a circular dependency when we try to get
	// the credentials to load the license data.
	if namespace == "uesio/core" {
		return LicenseMap{
			"uesio/io": {
				Active: true,
			},
		}, nil
	}
	licenseMap, ok := getLicenseCache(namespace)
	if ok {
		return licenseMap, nil
	}
	anonSession := sess.GetStudioAnonSession()
	app := meta.App{}
	err := PlatformLoadOne(&app, &PlatformLoadOptions{
		Connection: connection,
		Fields:     []adapt.LoadRequestField{},
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    adapt.UNIQUE_KEY_FIELD,
				Value:    namespace,
				Operator: "=",
			},
		},
	}, anonSession)
	if err != nil {
		return nil, err
	}
	licenses := meta.LicenseCollection{}
	err = PlatformLoad(
		&licenses,
		&PlatformLoadOptions{
			Connection: connection,
			Fields: []adapt.LoadRequestField{
				{
					ID: "uesio/studio.active",
				},
				{
					ID: "uesio/studio.app",
				},
				{
					ID: "uesio/studio.applicensed",
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    "uesio/studio.applicensed",
					Value:    app.ID,
					Operator: "=",
				},
			},
		},
		anonSession,
	)
	if err != nil {
		return nil, err
	}

	licenseMap = LicenseMap{}

	for _, license := range licenses {
		licenseMap[license.App.UniqueKey] = license
	}

	err = setLicenseCache(namespace, licenseMap)
	if err != nil {
		return nil, err
	}

	return licenseMap, nil
}
