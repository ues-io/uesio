package filesource

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func Delete(ctx context.Context, userFileID string, session *sess.Session) error {
	userFile := meta.UserFileMetadata{}
	err := datasource.PlatformLoadOne(
		&userFile,
		&datasource.PlatformLoadOptions{
			Conditions: []wire.LoadRequestCondition{
				{
					Field: commonfields.Id,
					Value: userFileID,
				},
			},
		},
		session,
	)

	if err != nil {
		return err
	}

	collectionID := userFile.CollectionID
	fieldID := userFile.FieldID

	metadataResponse := &wire.MetadataCache{}
	err = datasource.GetMetadataResponse(metadataResponse, collectionID, fieldID, session)
	if err != nil {
		return err
	}

	_, fieldMetadata, err := getUploadMetadata(metadataResponse, collectionID, fieldID)
	if err != nil {
		return err
	}

	err = datasource.PlatformDeleteOne(&userFile, nil, session)
	if err != nil {
		return err
	}

	if fieldMetadata != nil {

		if fieldMetadata.Type != "FILE" {
			return errors.New("can only delete files attached to FILE fields")
		}

		err = datasource.Save([]datasource.SaveRequest{
			{
				Collection: collectionID,
				Wire:       "filefieldupdate",
				Changes: &wire.Collection{
					{
						fieldID:         nil,
						commonfields.Id: userFile.RecordID,
					},
				},
			},
		}, session)
		if err != nil {
			return err
		}
	}

	return nil
}
