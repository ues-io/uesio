package systemdialect

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

const defaultSitePublicProfile = "uesio/core.public"
const bundleField = "uesio/studio.bundle->uesio/core.id"

func runSiteAfterSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	err := request.LoopInserts(func(change *wire.ChangeItem) error {

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

		newDeps := wire.Collection{}

		newDeps = append(newDeps, &wire.Item{
			"uesio/core.username":  "system",
			"uesio/core.type":      "PERSON",
			"uesio/core.firstname": "System",
			"uesio/core.lastname":  "User",
			"uesio/core.profile":   publicProfile,
		}, &wire.Item{
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
				Options: &wire.SaveOptions{
					Upsert: true,
				},
			},
		}, siteAdminSession, datasource.NewSaveOptions(connection, nil))

	})
	if err != nil {
		return err
	}

	err = request.LoopUpdates(func(change *wire.ChangeItem) error {

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

		updatedUsers := wire.Collection{
			&wire.Item{
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
				Options: &wire.SaveOptions{
					Upsert: true,
				},
			},
		}, siteAdminSession, datasource.NewSaveOptions(connection, nil))

	})
	if err != nil {
		return err
	}

	// If we are deleting sites, also truncate their data
	err = request.LoopDeletes(func(change *wire.ChangeItem) error {
		siteUniqueKey, err := change.GetOldFieldAsString(commonfields.UniqueKey)
		if err != nil {
			return err
		}
		if siteUniqueKey == "" {
			return errors.New("unable to get site unique key, cannot truncate data")
		}
		if err = connection.TruncateTenantData(sess.MakeSiteTenantID(siteUniqueKey)); err != nil {
			return fmt.Errorf("unable to truncate site data: %w", err)
		}
		return nil
	})
	if err != nil {
		return err
	}

	return clearHostCacheForSite(request, connection, session)
}

func clearHostCacheForSite(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	ids := getIDsFromUpdatesAndDeletes(request)
	domains := meta.SiteDomainCollection{}
	err := datasource.PlatformLoad(&domains, &datasource.PlatformLoadOptions{
		Conditions: []wire.LoadRequestCondition{
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
		id, err := item.GetField(commonfields.UniqueKey)
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
