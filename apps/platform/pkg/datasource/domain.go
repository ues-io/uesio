package datasource

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func QueryDomainFromSite(siteID string) (*meta.SiteDomain, error) {
	var sd meta.SiteDomain
	err := PlatformLoadOne(
		&sd,
		&PlatformLoadOptions{
			Fields: []adapt.LoadRequestField{
				{
					ID: "uesio/studio.domain",
				},
				{
					ID: "uesio/studio.type",
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/studio.site",
					Value: siteID,
				},
			},
			BatchSize:       1,
			ServerInitiated: true,
		},
		sess.GetStudioAnonSession(),
	)
	if err != nil {
		return nil, err
	}
	return &sd, nil
}

func GetHostFromDomain(domain *meta.SiteDomain, site *meta.Site) string {
	if domain.Type == "subdomain" {
		return fmt.Sprintf("https://%s.%s", domain.Domain, site.Domain)
	}
	return fmt.Sprintf("https://%s", domain.Domain)
}
