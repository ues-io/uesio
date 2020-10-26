package filesource

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapters"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Upload function
func Upload(fileBody io.Reader, details reqs.FileDetails, session *sess.Session) (string, error) {
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
		return "", errors.New("error Fetching newly created userfile")
	}
	path, err := ufc.GetPath(newUserFile, site.Name, session.GetWorkspaceID())
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
