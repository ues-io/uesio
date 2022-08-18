package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runSiteAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return clearHostCacheForSite(request, connection, session)
}

func clearHostCacheForSite(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	ids := getIDsFromUpdatesAndDeletes(request)
	domains := meta.SiteDomainCollection{}
	err := PlatformLoad(&domains, &PlatformLoadOptions{
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    "uesio/studio.site",
				Value:    ids,
				Operator: "IN",
			},
		},
		Connection: connection,
	}, session)
	if err != nil {
		return err
	}
	domainIds := []string{}
	err = domains.Loop(func(item loadable.Item, index string) error {
		id, err := item.GetField(adapt.UNIQUE_KEY_FIELD)
		if err != nil {
			return err
		}
		domainIds = append(domainIds, id.(string))
		return nil
	})
	if err != nil {
		return err
	}

	return clearHostForDomains(domainIds)
}
