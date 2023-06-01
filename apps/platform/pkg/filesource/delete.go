package filesource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func Delete(userFileID string, session *sess.Session) error {
	userFile := meta.UserFileMetadata{}
	err := datasource.PlatformLoadOne(
		&userFile,
		&datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:  adapt.ID_FIELD,
					Value:  userFileID,
					Active: true,
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

	metadataResponse := &adapt.MetadataCache{}
	err = getUploadMetadataResponse(metadataResponse, collectionID, fieldID, session)
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
			return errors.New("Can only delete files attached to FILE fields")
		}

		err = datasource.Save([]datasource.SaveRequest{
			{
				Collection: collectionID,
				Wire:       "filefieldupdate",
				Changes: &adapt.Collection{
					{
						fieldID:        nil,
						adapt.ID_FIELD: userFile.RecordID,
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
