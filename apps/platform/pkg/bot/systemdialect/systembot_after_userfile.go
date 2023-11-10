package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const (
	userCollectionId       = "uesio/core.user"
	studioFileCollectionId = "uesio/studio.file"
)

func runUserFileAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	// TASKS:
	// 1. Whenever a user file is updated,  if the file is the User's profile,
	// we need to invalidate the User cache in Redis
	// 2. If a new user file corresponding to a STUDIO file (static file) is inserted,
	// we need to transfer the Path property to the studio file as well

	appFullName := session.GetSite().GetAppFullName()

	userKeysToDelete := []string{}
	studioFileUpdates := adapt.Collection{}

	for _, insert := range request.Inserts {
		relatedCollection, err := insert.GetField("uesio/core.collectionid")
		if err != nil {
			continue
		}
		relatedRecord, err := insert.GetField("uesio/core.recordid")
		if err != nil {
			continue
		}
		if relatedCollection == userCollectionId {
			relatedField, err := insert.GetField("uesio/core.fieldid")
			if err != nil {
				continue
			}
			if relatedField == "uesio/core.picture" {
				userKeysToDelete = append(userKeysToDelete, auth.GetUserCacheKey(relatedRecord.(string), appFullName))
			}
		} else if relatedCollection == studioFileCollectionId {
			pathField, err := insert.GetField("uesio/core.path")
			if err != nil || pathField == "" {
				continue
			}
			if pathString, ok := pathField.(string); ok {
				studioFileUpdates = append(studioFileUpdates, &adapt.Item{
					"uesio/studio.path": pathString,
					"uesio/core.id":     relatedRecord.(string),
				})
				//Delete previous records
				ufmcToDelete := meta.UserFileMetadataCollection{}
				err = datasource.PlatformLoad(
					&ufmcToDelete,
					&datasource.PlatformLoadOptions{
						Conditions: []adapt.LoadRequestCondition{
							{
								Field:    "uesio/core.recordid",
								Operator: "EQ",
								Value:    relatedRecord.(string),
							},
						},
					},
					session,
				)

				for _, ufmToDelete := range ufmcToDelete {
					filesource.Delete(ufmToDelete.ID, session)
				}
			} else {
				continue
			}

		}
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
		err = datasource.SaveWithOptions([]datasource.SaveRequest{
			{
				Collection: studioFileCollectionId,
				Wire:       "StudioFiles",
				Changes:    &studioFileUpdates,
				Params:     request.Params,
			},
		}, session, datasource.GetConnectionSaveOptions(connection))
	}

	return err
}
