package filesource

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Delete function
func Delete(userFileID string, session *sess.Session) error {
	userFile := meta.UserFileMetadata{}
	err := datasource.PlatformLoadOne(&userFile, []adapt.LoadRequestCondition{
		{
			Field: "uesio.id",
			Value: userFileID,
		},
	}, session)

	if err != nil {
		return err
	}

	collectionID := userFile.CollectionID
	fieldID := strings.TrimPrefix(userFile.FieldID, "field_")

	metadataResponse, err := getUploadMetadataResponse(collectionID, fieldID, session)
	if err != nil {
		return err
	}

	collectionMetadata, fieldMetadata, err := getUploadMetadata(metadataResponse, collectionID, fieldID)
	if err != nil {
		return err
	}

	err = datasource.PlatformDeleteOne(&userFile, session)
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
						fieldID:                    nil,
						collectionMetadata.IDField: userFile.RecordID,
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
