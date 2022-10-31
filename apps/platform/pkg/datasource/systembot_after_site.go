package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runSiteAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	err := request.LoopInserts(func(change *adapt.ChangeItem) error {

		siteID := change.IDValue

		//This creates a copy of the session
		siteAdminSession := session.RemoveWorkspaceContext()

		err := AddSiteAdminContextByID(siteID, siteAdminSession, connection)
		if err != nil {
			return err
		}

		defaultSitePublicProfile := siteAdminSession.GetPublicProfile()

		if defaultSitePublicProfile == "" {
			defaultSitePublicProfile = "uesio/core.public"
		}

		newDeps := adapt.Collection{}

		newDeps = append(newDeps, &adapt.Item{
			"uesio/core.username":  "system",
			"uesio/core.type":      "PERSON",
			"uesio/core.firstname": "System",
			"uesio/core.lastname":  "User",
			"uesio/core.profile":   defaultSitePublicProfile,
		}, &adapt.Item{
			"uesio/core.username":  "guest",
			"uesio/core.type":      "PERSON",
			"uesio/core.firstname": "Guest",
			"uesio/core.lastname":  "User",
			"uesio/core.profile":   defaultSitePublicProfile,
		})

		// We can't bulkify this because we need to be in the context
		// of each site when we do these inserts.
		return SaveWithOptions([]SaveRequest{
			{
				Collection: "uesio/core.user",
				Wire:       "defaultusers",
				Changes:    &newDeps,
				Options: &adapt.SaveOptions{
					Upsert: true,
				},
			},
		}, siteAdminSession, GetConnectionSaveOptions(connection))

	})
	if err != nil {
		return err
	}

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
	err = domains.Loop(func(item meta.Item, index string) error {
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
