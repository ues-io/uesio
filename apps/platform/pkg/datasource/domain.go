package datasource

import (
	"context"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/tls"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func QueryDomainFromSite(ctx context.Context, siteID string, connection wire.Connection) (*meta.SiteDomain, error) {
	var sd meta.SiteDomain
	err := PlatformLoadOne(
		ctx,
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
		sess.GetStudioAnonSession(),
	)
	if err != nil {
		return nil, err
	}
	return &sd, nil
}

func GetHostFromDomain(domain *meta.SiteDomain, site *meta.Site) string {
	if domain.Type == "subdomain" {
		return fmt.Sprintf("%s://%s.%s", tls.ServeAppDefaultScheme(), domain.Domain, site.Domain)
	}
	return fmt.Sprintf("%s://%s", tls.ServeAppDefaultScheme(), domain.Domain)
}
