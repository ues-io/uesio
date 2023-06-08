package licensing

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func setLicenseCache(namespace string, licenses map[string]*meta.License) error {
	return cache.Set(cache.GetLicenseKey(namespace), &licenses)
}

func getLicenseCache(namespace string) (map[string]*meta.License, bool) {
	licenses := map[string]*meta.License{}
	err := cache.Get(cache.GetLicenseKey(namespace), &licenses)
	if err != nil {
		fmt.Println("Err: " + err.Error())
		return nil, false
	}
	return licenses, true
}

func GetLicenses(namespace string, connection adapt.Connection) (map[string]*meta.License, error) {
	licenseMap, ok := getLicenseCache(namespace)
	if ok {
		return licenseMap, nil
	}
	fmt.Println("Getting License for: " + namespace)
	anonSession := sess.GetStudioAnonSession()
	app := meta.App{}
	err := datasource.PlatformLoadOne(&app, &datasource.PlatformLoadOptions{
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
	err = datasource.PlatformLoad(
		&licenses,
		&datasource.PlatformLoadOptions{
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
