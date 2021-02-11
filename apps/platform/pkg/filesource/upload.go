package filesource

import (
	"errors"
	"io"
	"mime"
	"net/url"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// FileDetails struct
type FileDetails struct {
	ContentLength    uint64
	Name             string
	CollectionID     string
	RecordID         string
	FieldID          string
	FileCollectionID string
}

// NewFileDetails function
func NewFileDetails(query url.Values) (*FileDetails, error) {

	name := query.Get("name")
	if name == "" {
		return nil, errors.New("No name specified")
	}

	fileCollection := query.Get("filecollection")
	if fileCollection == "" {
		return nil, errors.New("No filecollection specified")
	}

	collectionID := query.Get("collectionid")
	if collectionID == "" {
		return nil, errors.New("No collectionid specified")
	}

	recordID := query.Get("recordid")
	if recordID == "" {
		return nil, errors.New("No recordid specified")
	}

	//Not required. If not specified is treated as an attachment
	fieldID := query.Get("fieldid")

	return &FileDetails{
		Name:             name,
		FileCollectionID: fileCollection,
		CollectionID:     collectionID,
		RecordID:         recordID,
		FieldID:          fieldID,
	}, nil
}

func getFieldIDPart(details FileDetails) string {
	fieldID := details.FieldID
	if fieldID == "" {
		return "attachment_" + details.Name
	}
	return "field_" + fieldID
}

// Upload function
func Upload(fileBody io.Reader, details FileDetails, session *sess.Session) (*meta.UserFileMetadata, error) {
	site := session.GetSite()
	workspaceID := session.GetWorkspaceID()
	ufc, fs, err := fileadapt.GetFileSourceAndCollection(details.FileCollectionID, session)
	if err != nil {
		return nil, err
	}

	ufm := meta.UserFileMetadata{
		CollectionID:     details.CollectionID,
		MimeType:         mime.TypeByExtension(filepath.Ext(details.Name)),
		FieldID:          getFieldIDPart(details),
		FileCollectionID: details.FileCollectionID,
		Name:             details.Name,
		RecordID:         details.RecordID,
		SiteID:           site.Name,
		WorkspaceID:      workspaceID,
	}

	path, err := ufc.GetFilePath(&ufm, site.Name, session.GetWorkspaceID())
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
	if details.FieldID != "" {
		// Keep a running tally of all requested collections
		collections := datasource.MetadataRequest{}
		err := collections.AddField(details.CollectionID, details.FieldID, nil)
		if err != nil {
			return nil, err
		}

		metadataResponse := adapt.MetadataCache{}

		err = collections.Load(nil, &metadataResponse, session)
		if err != nil {
			return nil, err
		}

		collectionMetadata, err := metadataResponse.GetCollection(details.CollectionID)
		if err != nil {
			return nil, err
		}

		fieldMetadata, err := collectionMetadata.GetField(details.FieldID)
		if err != nil {
			return nil, err
		}

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
