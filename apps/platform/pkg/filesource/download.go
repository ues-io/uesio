package filesource

import (
	"io"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapters"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Download function
func Download(userFileID string, session *sess.Session) (io.ReadCloser, *metadata.UserFileMetadata, error) {
	site := session.GetSite()
	userFile, err := datasource.GetUserFile(userFileID, session)
	if err != nil {
		return nil, nil, err
	}

	ufc, fs, err := datasource.GetFileSourceAndCollection(userFile.FileCollectionID, session)

	if err != nil {
		return nil, nil, err
	}

	bucket, err := ufc.GetBucket(site)
	if err != nil {
		return nil, nil, err
	}
	path, err := ufc.GetPath(userFile, site.Name, session.GetWorkspaceID())
	if err != nil {
		return nil, nil, err
	}

	fileAdapter, err := fileadapters.GetFileAdapter(fs.GetAdapterType())
	if err != nil {
		return nil, nil, err
	}
	credentials, err := fs.GetCredentials(site)
	if err != nil {
		return nil, nil, err
	}
	content, err := fileAdapter.Download(bucket, path, credentials)
	if err != nil {
		return nil, nil, err
	}

	return content, userFile, nil

}
