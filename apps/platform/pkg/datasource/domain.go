package datasource

import (
	"context"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func QueryDomainFromSite(siteID string, connection wire.Connection) (*meta.SiteDomain, error) {
	var sd meta.SiteDomain
	err := PlatformLoadOne(
		&sd,
		&PlatformLoadOptions{
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/studio.domain",
				},
				{
					ID: "uesio/studio.type",
				},
			},
			Conditions: []wire.LoadRequestCondition{
				{
					Field: "uesio/studio.site",
					Value: siteID,
				},
			},
			BatchSize:  1,
			Connection: connection,
		},
		sess.GetStudioAnonSession(context.Background()),
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
