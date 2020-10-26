package filesource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapters"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Delete function
func Delete(userFileID string, session *sess.Session) error {
	site := session.GetSite()
	userFile, err := datasource.GetUserFile(userFileID, session)
	if err != nil {
		return err
	}
	ufc, fs, err := datasource.GetFileSourceAndCollection(userFile.FileCollectionID, session)
	if err != nil {
		return err
	}
	bucket, err := ufc.GetBucket(site)
	if err != nil {
		return err
	}
	path, err := ufc.GetPath(userFile, site.Name, session.GetWorkspaceID())
	if err != nil {
		return errors.New("No filesource found")
	}

	fileAdapter, err := fileadapters.GetFileAdapter(fs.GetAdapterType())
	if err != nil {
		return err
	}
	credentials, err := fs.GetCredentials(site)
	if err != nil {
		return err
	}
	err = fileAdapter.Delete(bucket, path, credentials)
	if err != nil {
		return err
	}

	err = datasource.DeleteUserFileRecord(userFile, session)
	if err != nil {
		return err
	}

	return nil
}
