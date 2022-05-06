package filesource

import (
	"errors"
	"io"
	"mime"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetFileMetadataType(details *fileadapt.FileDetails) string {
	if details.FieldID == "" {
		return "attachment"
	}
	return "field"
}

func GetFileUniqueName(details *fileadapt.FileDetails) string {
	if details.FieldID == "" {
		return details.Name
	}
	return details.FieldID
}

func getUploadMetadataResponse(collectionID, fieldID string, session *sess.Session) (*adapt.MetadataCache, error) {
	collections := datasource.MetadataRequest{}

	if fieldID != "" {
		err := collections.AddField(collectionID, fieldID, nil)
		if err != nil {
			return nil, err
		}
	} else {
		err := collections.AddCollection(collectionID)
		if err != nil {
			return nil, err
		}
	}

	metadataResponse := adapt.MetadataCache{}

	err := collections.Load(&metadataResponse, session)
	if err != nil {
		return nil, err
	}

	return &metadataResponse, nil
}

type FileUploadOp struct {
	Data    io.Reader
	Details *fileadapt.FileDetails
}

func getUploadMetadata(metadataResponse *adapt.MetadataCache, collectionID, fieldID string) (*adapt.CollectionMetadata, *adapt.FieldMetadata, error) {
	collectionMetadata, err := metadataResponse.GetCollection(collectionID)
	if err != nil {
		return nil, nil, err
	}

	if fieldID == "" {
		return collectionMetadata, nil, nil
	}

	fieldMetadata, err := collectionMetadata.GetField(fieldID)
	if err != nil {
		return nil, nil, err
	}
	return collectionMetadata, fieldMetadata, nil
}

func Upload(ops []FileUploadOp, connection adapt.Connection, session *sess.Session) ([]meta.UserFileMetadata, error) {

	response := []meta.UserFileMetadata{}
	for _, op := range ops {
		details := op.Details
		metadataResponse, err := getUploadMetadataResponse(details.CollectionID, details.FieldID, session)
		if err != nil {
			return nil, err
		}

		collectionMetadata, fieldMetadata, err := getUploadMetadata(metadataResponse, details.CollectionID, details.FieldID)
		if err != nil {
			return nil, err
		}

		fileCollectionID, err := fileadapt.GetFileCollectionID(collectionMetadata, fieldMetadata)
		if err != nil {
			return nil, err
		}

		ufc, fs, err := fileadapt.GetFileSourceAndCollection(fileCollectionID, session)
		if err != nil {
			return nil, err
		}

		ufm := meta.UserFileMetadata{
			CollectionID:     details.CollectionID,
			MimeType:         mime.TypeByExtension(filepath.Ext(details.Name)),
			FieldID:          details.FieldID,
			Type:             GetFileMetadataType(details),
			FileCollectionID: fileCollectionID,
			FileName:         details.Name,
			Name:             GetFileUniqueName(details), // Different for file fields and attachments
			RecordID:         details.RecordID,
		}

		path, err := ufc.GetFilePath(&ufm)
		if err != nil {
			return nil, errors.New("error generating path for userfile: " + err.Error())
		}

		ufm.Path = path

		err = datasource.PlatformSaveOne(&ufm, &adapt.SaveOptions{
			Upsert: &adapt.UpsertOptions{},
		}, connection, session)
		if err != nil {
			return nil, err
		}

		conn, err := fileadapt.GetFileConnection(fs.GetKey(), session)
		if err != nil {
			return nil, err
		}
		err = conn.Upload(op.Data, path)
		if err != nil {
			return nil, err
		}
		if fieldMetadata != nil {

			if fieldMetadata.Type != "FILE" {
				return nil, errors.New("Can only attach files to FILE fields")
			}

			err = datasource.SaveWithOptions([]datasource.SaveRequest{
				{
					Collection: details.CollectionID,
					Wire:       "filefieldupdate",
					Changes: &adapt.Collection{
						{
							details.FieldID: map[string]interface{}{
								adapt.ID_FIELD: ufm.ID,
							},
							adapt.ID_FIELD: details.RecordID,
						},
					},
				},
			}, session, datasource.GetConnectionSaveOptions(connection))
			if err != nil {
				return nil, errors.New("Failed to update field for the given file: " + err.Error())
			}
		}
		response = append(response, ufm)
	}

	return response, nil
}
