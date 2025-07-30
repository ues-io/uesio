package systemdialect

import (
	"context"
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/limits"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runDomainAfterSaveSiteBot(ctx context.Context, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	err := enforceMaxDomainsLimit(ctx, request, connection, session)
	if err != nil {
		return err
	}
	return clearHostCacheForDomain(request)
}

func clearHostCacheForDomain(request *wire.SaveOp) error {
	return auth.ClearHostCacheForDomains(getUniqueKeysFromUpdatesAndDeletes(request))
}

func enforceMaxDomainsLimit(ctx context.Context, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	// We need to enforce a limit on max domains per user
	// To do that, we need to query for all domains across all sites' apps
	// for the site domains being inserted
	sitesBeingInserted := map[string]bool{}
	err := request.LoopInserts(func(change *wire.ChangeItem) error {
		siteId, err1 := change.GetFieldAsString("uesio/studio.site->uesio/core.id")
		if err1 != nil {
			return err1
		}
		sitesBeingInserted[siteId] = true
		return nil
	})
	if err != nil {
		return err
	}
	// If no sites are being inserted, there's nothing else to do.
	if len(sitesBeingInserted) == 0 {
		return nil
	}
	uniqueSiteIds := goutils.MapKeys(sitesBeingInserted)

	// Query for the users associated with all of these sites
	users := meta.UserCollection{}
	uniqueUserIds := map[string]string{}
	err = datasource.PlatformLoad(ctx, &users, &datasource.PlatformLoadOptions{
		Conditions: []wire.LoadRequestCondition{
			{
				Field:         "uesio/core.id",
				Operator:      "IN",
				Type:          "SUBQUERY",
				SubCollection: "uesio/studio.app",
				SubField:      "uesio/studio.user",
				SubConditions: []wire.LoadRequestCondition{
					{
						Field:         "uesio/core.id",
						Operator:      "IN",
						Type:          "SUBQUERY",
						SubCollection: "uesio/studio.site",
						SubField:      "uesio/studio.app",
						SubConditions: []wire.LoadRequestCondition{
							{
								Field:    "uesio/core.id",
								Operator: "IN",
								Values:   uniqueSiteIds,
							},
						},
					},
				},
			},
		},
		Fields: []wire.LoadRequestField{
			{
				ID: "uesio/core.id",
			},
			{
				ID: "uesio/core.username",
			},
		},
		Connection: connection,
	}, session)
	if err != nil {
		return err
	}
	err = users.Loop(func(user meta.Item, _ string) error {
		userId, err5 := user.GetField("uesio/core.id")
		if err5 != nil {
			return err5
		}
		username, err5 := user.GetField("uesio/core.username")
		if err5 != nil {
			return err5
		}
		if userIdString, ok := userId.(string); ok {
			uniqueUserIds[userIdString] = username.(string)
		} else {
			return errors.New("unable to get user id")
		}
		return nil
	})
	if err != nil {
		return err
	}

	currentDomainsPerUser := map[string]int{}

	// Lookup the current total domains for these users
	domainsForUsers := meta.SiteDomainCollection{}
	err = datasource.PlatformLoad(ctx, &domainsForUsers, &datasource.PlatformLoadOptions{
		Conditions: []wire.LoadRequestCondition{
			{
				Field:    "uesio/studio.site->uesio/studio.app->uesio/studio.user",
				Operator: "IN",
				Values:   goutils.MapKeys(uniqueUserIds),
			},
		},
		Fields: []wire.LoadRequestField{
			{
				ID: "uesio/studio.site",
				Fields: []wire.LoadRequestField{
					{
						ID: "uesio/studio.app",
						Fields: []wire.LoadRequestField{
							{
								ID: "uesio/studio.user",
							},
						},
					},
				},
			},
			{
				ID: "uesio/studio.domain",
			},
			{
				ID: "uesio/studio.type",
			},
		},
		Connection: connection,
	}, session)
	if err != nil {
		return err
	}

	// Aggregate existing domains by user
	err = domainsForUsers.Loop(func(domain meta.Item, _ string) error {
		userId, err5 := domain.GetField("uesio/studio.site->uesio/studio.app->uesio/studio.user->uesio/core.id")
		if err5 != nil {
			// Allow the loop to continue
			return nil
		}
		userIdString, ok := userId.(string)
		if !ok {
			// Allow the loop to continue
			return nil
		}
		totalDomainsByUser, haveDomains := currentDomainsPerUser[userIdString]
		if haveDomains {
			currentDomainsPerUser[userIdString] = totalDomainsByUser + 1
		} else {
			currentDomainsPerUser[userIdString] = 1
		}
		return nil
	})
	if err != nil {
		return err
	}
	// Now compare the limits to the existing domains and the delta
	for userId := range uniqueUserIds {
		// Lookup the limit
		limitDomains, err3 := limits.GetLimitDomainsPerUser(ctx, userId, session)
		if err3 != nil {
			return fmt.Errorf("unable to determine the limit for max domains for user: %s", uniqueUserIds[userId])
		}
		// Compute all the variables that go into the equation
		existingDomains, hasDomains := currentDomainsPerUser[userId]
		if !hasDomains {
			existingDomains = 0
		}
		// FINALLY --- the validation!
		if existingDomains > limitDomains {
			return fmt.Errorf("this change would cause the user %s to exceed their maximum number of allowed domains (%d)", uniqueUserIds[userId], limitDomains)
		}
	}

	return nil
}
