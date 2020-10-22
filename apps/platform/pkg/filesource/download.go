package filesource

import (
	"io"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapters"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// Download function
func Download(userFileID string, site *metadata.Site, sess *session.Session) (io.ReadCloser, string, error) {
	userFile, err := datasource.GetUserFile(userFileID, site, sess)
	if err != nil {
		return nil, "", err
	}

	ufc, fs, err := datasource.GetFileSourceAndCollection(userFile.FileCollectionID, site, sess)

	if err != nil {
		return nil, "", err
	}

	bucket, err := ufc.GetBucket(site)
	if err != nil {
		return nil, "", err
	}
	path, err := ufc.GetPath(userFile, site)
	if err != nil {
		return nil, "", err
	}

	fileAdapter, err := fileadapters.GetFileAdapter(fs.GetAdapterType())
	if err != nil {
		return nil, "", err
	}
	credentials, err := fs.GetCredentials(site)
	if err != nil {
		return nil, "", err
	}
	content, err := fileAdapter.Download(bucket, path, credentials)
	if err != nil {
		return nil, "", err
	}

	return content, userFile.MimeType, nil

}
