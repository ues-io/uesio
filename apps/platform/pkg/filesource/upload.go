package filesource

import (
	"errors"
	"io"
	"mime"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getFieldIDPart(details fileadapt.FileDetails) string {
	fieldID := details.FieldID
	if fieldID == "" {
		return "attachment_" + details.Name
	}
	return "field_" + fieldID
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

	err := collections.Load(nil, &metadataResponse, session)
	if err != nil {
		return nil, err
	}

	return &metadataResponse, nil
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

// Upload function
func Upload(fileBody io.Reader, details fileadapt.FileDetails, session *sess.Session) (*meta.UserFileMetadata, error) {
	site := session.GetSite()
	workspaceID := session.GetWorkspaceID()

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
		FieldID:          getFieldIDPart(details),
		FileCollectionID: fileCollectionID,
		Name:             details.Name,
		RecordID:         details.RecordID,
		SiteID:           site.GetFullName(),
		WorkspaceID:      workspaceID,
	}

	path, err := ufc.GetFilePath(&ufm, site.GetFullName(), session.GetWorkspaceID())
	if err != nil {
		return nil, errors.New("error generating path for userfile: " + err.Error())
	}

	ufm.Path = path

	err = datasource.PlatformSaveOne(&ufm, &adapt.SaveOptions{
		Upsert: &adapt.UpsertOptions{},
	}, session)
	if err != nil {
		return nil, err
	}

	fileAdapter, err := fileadapt.GetFileAdapter(fs.Type)
	if err != nil {
		return nil, err
	}
	credentials, err := adapt.GetCredentials(fs.Credentials, session)
	if err != nil {
		return nil, err
	}
	bucket, err := configstore.GetValueFromKey(ufc.Bucket, session)
	if err != nil {
		return nil, err
	}
	err = fileAdapter.Upload(fileBody, bucket, path, credentials)
	if err != nil {
		return nil, err
	}
	if fieldMetadata != nil {

		if fieldMetadata.Type != "FILE" {
			return nil, errors.New("Can only attach files to FILE fields")
		}

		refMetadata, err := metadataResponse.GetCollection(fieldMetadata.ReferencedCollection)
		if err != nil {
			return nil, err
		}

		err = datasource.Save([]datasource.SaveRequest{
			{
				Collection: details.CollectionID,
				Wire:       "filefieldupdate",
				Changes: &adapt.Collection{
					{
						details.FieldID: map[string]interface{}{
							refMetadata.IDField: ufm.ID,
						},
						collectionMetadata.IDField: details.RecordID,
					},
				},
			},
		}, session)
		if err != nil {
			return nil, errors.New("Failed to update field for the given file: " + err.Error())
		}
	}
	return &ufm, nil
}
