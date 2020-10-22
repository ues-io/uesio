package filesource

import (
	"errors"
	"io"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapters"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// Upload function
func Upload(fileBody io.Reader, details reqs.FileDetails, site *metadata.Site, sess *session.Session) (string, error) {

	ufc, fs, err := datasource.GetFileSourceAndCollection(details.FileCollectionID, site, sess)
	if err != nil {
		return "", err
	}
	bucket, err := ufc.GetBucket(site)
	if err != nil {
		return "", err
	}

	id, err := datasource.CreateUserFileMetadataEntry(details, site, sess)
	if err != nil {
		return "", errors.New("Error creating metadata entry for file")
	}
	newUserFile, err := datasource.GetUserFile(id, site, sess)
	if err != nil {
		return "", errors.New("error Fetching newly created userfile")
	}
	path, err := ufc.GetPath(newUserFile, site)
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
		err = datasource.UpdateRecordFieldWithFileID(id, details, site, sess)
		if err != nil {
			return "", err
		}
	}
	return id, nil
}
