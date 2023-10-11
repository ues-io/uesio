package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const defaultSitePublicProfile = "uesio/core.public"
const bundleField = "uesio/studio.bundle->uesio/core.id"

func runSiteAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	err := request.LoopInserts(func(change *adapt.ChangeItem) error {

		siteID := change.IDValue

		siteAdminSession, err := datasource.AddSiteAdminContextByID(siteID, session, connection)
		if err != nil {
			return err
		}

		// NOTE: DO NOT USE siteAdminSession.GetPublicProfile(), as this will be on the wrong site!!
		// We need to get the PublicProfile of the site whose admin context we are temporarily assuming
		publicProfile := siteAdminSession.GetSiteAdmin().GetAppBundle().PublicProfile

		if publicProfile == "" {
			publicProfile = defaultSitePublicProfile
		}

		newDeps := adapt.Collection{}

		newDeps = append(newDeps, &adapt.Item{
			"uesio/core.username":  "system",
			"uesio/core.type":      "PERSON",
			"uesio/core.firstname": "System",
			"uesio/core.lastname":  "User",
			"uesio/core.profile":   publicProfile,
		}, &adapt.Item{
			"uesio/core.username":  "guest",
			"uesio/core.type":      "PERSON",
			"uesio/core.firstname": "Guest",
			"uesio/core.lastname":  "User",
			"uesio/core.profile":   publicProfile,
		})

		// We can't bulkify this because we need to be in the context
		// of each site when we do these inserts.
		return datasource.SaveWithOptions([]datasource.SaveRequest{
			{
				Collection: "uesio/core.user",
				Wire:       "defaultusers",
				Changes:    &newDeps,
				Options: &adapt.SaveOptions{
					Upsert: true,
				},
			},
		}, siteAdminSession, datasource.GetConnectionSaveOptions(connection))

	})
	if err != nil {
		return err
	}

	err = request.LoopUpdates(func(change *adapt.ChangeItem) error {

		siteID := change.IDValue

		// Whenever the site BUNDLE has changed, we need to synchronize the public profile
		// using the new app bundle version
		oldBundle, err := change.GetOldFieldAsString(bundleField)
		if err != nil {
			return err
		}
		newBundle, err := change.GetFieldAsString(bundleField)
		if err != nil {
			return err
		}

		// If bundle hasn't changed, we're done
		if oldBundle == newBundle {
			return nil
		}

		siteAdminSession, err := datasource.AddSiteAdminContextByID(siteID, session, connection)
		if err != nil {
			return err
		}

		newPublicProfile := siteAdminSession.GetPublicProfile()
		if newPublicProfile == "" {
			newPublicProfile = defaultSitePublicProfile
		}

		updatedUsers := adapt.Collection{
			&adapt.Item{
				"uesio/core.username":  "guest",
				"uesio/core.uniquekey": "guest",
				"uesio/core.profile":   newPublicProfile,
			},
		}

		// We can't bulkify this because we need to be in the context
		// of each site when we do these updates.
		return datasource.SaveWithOptions([]datasource.SaveRequest{
			{
				Collection: "uesio/core.user",
				Wire:       "updateUsers",
				Changes:    &updatedUsers,
				Options: &adapt.SaveOptions{
					Upsert: true,
				},
			},
		}, siteAdminSession, datasource.GetConnectionSaveOptions(connection))

	})
	if err != nil {
		return err
	}

	return clearHostCacheForSite(request, connection, session)
}

func clearHostCacheForSite(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	ids := getIDsFromUpdatesAndDeletes(request)
	domains := meta.SiteDomainCollection{}
	err := datasource.PlatformLoad(&domains, &datasource.PlatformLoadOptions{
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

	return auth.ClearHostCacheForDomains(domainIds)
}
