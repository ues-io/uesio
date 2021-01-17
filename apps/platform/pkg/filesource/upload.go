package filesource

import (
	"errors"
	"io"
	"mime"
	"net/url"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapters"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getFieldIDPart(details datasource.FileDetails) string {
	fieldID := details.FieldID
	if fieldID == "" {
		return "attachment_" + details.Name
	}
	return "field_" + fieldID
}

// Upload function
func Upload(fileBody io.Reader, details datasource.FileDetails, session *sess.Session) (string, error) {
	site := session.GetSite()
	workspaceID := session.GetWorkspaceID()
	ufc, fs, err := datasource.GetFileSourceAndCollection(details.FileCollectionID, session)
	if err != nil {
		return "", err
	}

	ufm := metadata.UserFileMetadata{
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
		return "", errors.New("error generating path for userfile: " + err.Error())
	}

	ufm.Path = path

	err = datasource.PlatformSaveOne(&ufm, &adapters.SaveOptions{
		Upsert: &adapters.UpsertOptions{},
	}, session)
	if err != nil {
		return "", err
	}

	fileAdapter, err := fileadapters.GetFileAdapter(fs.GetAdapterType())
	if err != nil {
		return "", err
	}
	credentials, err := fs.GetCredentials(site)
	if err != nil {
		return "", err
	}
	bucket, err := ufc.GetBucket(site)
	if err != nil {
		return "", err
	}
	err = fileAdapter.Upload(fileBody, bucket, path, credentials)
	if err != nil {
		return "", err
	}
	if details.FieldID != "" {
		err = datasource.UpdateRecordFieldWithFileID(ufm.ID, details, session)
		if err != nil {
			return "", err
		}
	}
	return ufm.ID, nil
}

// ConvertQueryToFileDetails function
func ConvertQueryToFileDetails(query url.Values) (*datasource.FileDetails, error) {

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

	return &datasource.FileDetails{
		Name:             name,
		FileCollectionID: fileCollection,
		CollectionID:     collectionID,
		RecordID:         recordID,
		FieldID:          fieldID,
	}, nil
}
