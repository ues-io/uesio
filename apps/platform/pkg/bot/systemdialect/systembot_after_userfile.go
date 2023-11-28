package systemdialect

import (
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const (
	userCollectionId       = "uesio/core.user"
	studioFileCollectionId = "uesio/studio.file"
	studioBotCollectionId  = "uesio/studio.bot"
)

func runUserFileAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	// TASKS:
	// 1. Whenever a user file is inserted or updated,  if the file is the User's profile,
	// we need to invalidate the User cache in Redis
	// 2. If a new user file corresponding to a STUDIO file (static file) is inserted,
	// we need to transfer the Path property to the studio file as well

	appFullName := session.GetSite().GetAppFullName()

	var userKeysToDelete []string
	studioFileUpdates := adapt.Collection{}
	studioBotUpdates := adapt.Collection{}

	if err := request.LoopChanges(func(change *adapt.ChangeItem) error {
		relatedCollection, err := change.GetField("uesio/core.collectionid")
		if err != nil {
			return err
		}
		relatedRecordId, err := change.GetFieldAsString("uesio/core.recordid")
		if err != nil {
			return err
		}
		if relatedCollection == userCollectionId {
			relatedField, err := change.GetField("uesio/core.fieldid")
			if err != nil {
				return err
			}
			if relatedField == "uesio/core.picture" {
				userKeysToDelete = append(userKeysToDelete, auth.GetUserCacheKey(relatedRecordId, appFullName))
			}
		} else if relatedCollection == studioFileCollectionId {
			pathField, err := change.GetField("uesio/core.path")
			if err != nil || pathField == "" {
				return nil
			}
			if pathString, ok := pathField.(string); ok {
				studioFileUpdates = append(studioFileUpdates, &adapt.Item{
					"uesio/studio.path": pathString,
					adapt.ID_FIELD:      relatedRecordId,
				})
			} else {
				return nil
			}
		} else if relatedCollection == studioBotCollectionId {
			// Increment the timestamp on the parent Bot,
			// so that we are able to achieve cache invalidation
			studioBotUpdates = append(studioBotUpdates, &adapt.Item{
				adapt.UPDATED_AT_FIELD: time.Now().Unix(),
				adapt.ID_FIELD:         relatedRecordId,
			})
		}
		return nil
	}); err != nil {
		return err
	}

	for _, deleteItem := range request.Deletes {
		relatedCollection, err := deleteItem.OldValues.GetField("uesio/core.collectionid")
		if err != nil {
			continue
		}
		relatedField, err := deleteItem.OldValues.GetField("uesio/core.fieldid")
		if err != nil {
			continue
		}
		relatedRecord, err := deleteItem.OldValues.GetField("uesio/core.recordid")
		if err != nil {
			continue
		}
		if (relatedCollection == "uesio/core.user") &&
			(relatedField == "uesio/core.picture") {
			userKeysToDelete = append(userKeysToDelete, auth.GetUserCacheKey(relatedRecord.(string), appFullName))
		}
	}
	// Continue on even if there are failures here, maybe in the future we can schedule an update to clean up bad keys
	// if Redis is temporarily down?
	err := auth.DeleteUserCacheEntries(userKeysToDelete...)

	// If the related collection is uesio/studio.file,
	// we need to set the file path on the related record as well
	if len(studioFileUpdates) > 0 {
		if err = datasource.SaveWithOptions([]datasource.SaveRequest{
			{
				Collection: studioFileCollectionId,
				Wire:       "StudioFiles",
				Changes:    &studioFileUpdates,
				Params:     request.Params,
			},
		}, session, datasource.GetConnectionSaveOptions(connection)); err != nil {
			return err
		}
	}
	if len(studioBotUpdates) > 0 {
		err = datasource.SaveWithOptions([]datasource.SaveRequest{
			{
				Collection: studioBotCollectionId,
				Wire:       "StudioBots",
				Changes:    &studioBotUpdates,
				Params:     request.Params,
			},
		}, session, datasource.GetConnectionSaveOptions(connection))
	}

	return err
}
