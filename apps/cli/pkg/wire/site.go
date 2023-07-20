package wire

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func GetAvailableSiteNames(appID string) ([]string, error) {
	names := []string{}

	sites, err := GetAvailableSites(appID)
	if err != nil {
		return nil, err
	}

	if len(sites) == 0 {
		return names, nil
	}
	for _, item := range sites {
		siteName, err := item.GetFieldAsString("uesio/studio.name")
		if err != nil {
			return nil, err
		}
		names = append(names, siteName)
	}

	return names, nil
}

func GetAvailableSites(appID string) (adapt.Collection, error) {
	return Load(
		"uesio/studio.site",
		&LoadOptions{
			Fields: []adapt.LoadRequestField{
				{
					ID: "uesio/studio.name",
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    "uesio/studio.app",
					RawValue: appID,
				},
			},
		},
	)
}

func DoesSiteExist(appID, siteName string) (bool, error) {
	sites, err := Load(
		"uesio/studio.site",
		&LoadOptions{
			Fields: []adapt.LoadRequestField{
				{
					ID: "uesio/studio.name",
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    "uesio/studio.app",
					RawValue: appID,
				},
				{
					Field:    "uesio/studio.name",
					RawValue: siteName,
				},
			},
		},
	)
	if err != nil {
		return false, err
	}
	return len(sites) == 1, nil
}
