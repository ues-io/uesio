package filesource

import (
	"errors"
	"io"
	"net/url"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapters"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Upload function
func Upload(fileBody io.Reader, details datasource.FileDetails, session *sess.Session) (string, error) {
	site := session.GetSite()
	ufc, fs, err := datasource.GetFileSourceAndCollection(details.FileCollectionID, session)
	if err != nil {
		return "", err
	}
	bucket, err := ufc.GetBucket(site)
	if err != nil {
		return "", err
	}

	id, err := datasource.CreateUserFileMetadataEntry(details, session)
	if err != nil {
		return "", errors.New("Error creating metadata entry for file")
	}
	newUserFile, err := datasource.GetUserFile(id, session)
	if err != nil {
		return "", errors.New("error Fetching newly created userfile: " + id + " : " + err.Error())
	}
	path, err := ufc.GetFilePath(newUserFile, site.Name, session.GetWorkspaceID())
	if err != nil {
		return "", errors.New("error generating path for userfile: " + err.Error())
	}
	fileAdapter, err := fileadapters.GetFileAdapter(fs.GetAdapterType())
	if err != nil {
		return "", err
	}
	credentials, err := fs.GetCredentials(site)
	if err != nil {
		return "", err
	}
	err = fileAdapter.Upload(fileBody, bucket, path, credentials)
	if err != nil {
		return "", err
	}
	if details.FieldID != "" {
		err = datasource.UpdateRecordFieldWithFileID(id, details, session)
		if err != nil {
			return "", err
		}
	}
	return id, nil
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
