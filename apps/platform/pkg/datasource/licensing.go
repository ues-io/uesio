package datasource

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/go-chi/traceid"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type LicenseMap map[string]*meta.License

var licenseCache cache.Cache[LicenseMap]

func init() {
	licenseCache = cache.NewPlatformCache[LicenseMap]("license", 0)
}

func InvalidateLicenseCaches(namespaces []string) error {
	return licenseCache.Del(namespaces...)
}

func InvalidateCache() error {
	return licenseCache.DeleteAll()
}

func setLicenseCache(namespace string, licenses LicenseMap) error {
	return licenseCache.Set(namespace, licenses)
}

func getLicenseCache(namespace string) (LicenseMap, bool) {
	licenses, err := licenseCache.Get(namespace)
	if err != nil {
		if errors.Is(err, cache.ErrKeyNotFound) {
			return nil, false
		} else {
			slog.Error(fmt.Sprintf("error getting licenses for namespace [%s] from cache: %v", namespace, err))
			return nil, false
		}
	}
	return licenses, true
}

func GetLicenses(namespace string, connection wire.Connection) (LicenseMap, error) {
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
	anonSession := sess.GetStudioAnonSession(traceid.NewContext(context.Background()))
	app := meta.App{}
	err := PlatformLoadOne(&app, &PlatformLoadOptions{
		Connection: connection,
		Fields:     []wire.LoadRequestField{},
		Conditions: []wire.LoadRequestCondition{
			{
				Field:    commonfields.UniqueKey,
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
			Fields: []wire.LoadRequestField{
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
			Conditions: []wire.LoadRequestCondition{
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
