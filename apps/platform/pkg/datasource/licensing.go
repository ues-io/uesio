package datasource

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

var licenseCache cache.Cache[map[string]*meta.License]

func init() {
	licenseCache = cache.NewRedisCache[map[string]*meta.License]("license")
}

func InvalidateLicenseCaches(namespaces []string) error {
	return licenseCache.Del(namespaces...)
}

func setLicenseCache(namespace string, licenses map[string]*meta.License) error {
	return licenseCache.Set(namespace, licenses)
}

func getLicenseCache(namespace string) (map[string]*meta.License, bool) {
	licenses, err := licenseCache.Get(namespace)
	if err != nil {
		logger.LogError(fmt.Errorf("unable to retrieve licenses from cache: %s", err.Error()))
		return nil, false
	}
	if licenses == nil {
		return nil, false
	}
	return licenses, true
}

func GetLicenses(namespace string, connection adapt.Connection) (map[string]*meta.License, error) {
	// Hardcode the license for uesio/core
	// This prevents a circular dependency when we try to get
	// the credentials to load the license data.
	if namespace == "uesio/core" {
		return map[string]*meta.License{
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

	licenseMap = map[string]*meta.License{}

	for _, license := range licenses {
		licenseMap[license.App.UniqueKey] = license
	}

	err = setLicenseCache(namespace, licenseMap)
	if err != nil {
		return nil, err
	}

	return licenseMap, nil
}
