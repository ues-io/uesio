package filesource

import (
	"errors"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapters"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// Delete function
func Delete(userFileID string, site *metadata.Site, sess *session.Session) error {
	userFile, err := datasource.GetUserFile(userFileID, site, sess)
	if err != nil {
		return err
	}
	ufc, fs, err := datasource.GetFileSourceAndCollection(userFile.FileCollectionID, site, sess)
	if err != nil {
		return err
	}
	bucket, err := ufc.GetBucket(site)
	if err != nil {
		return err
	}
	path, err := ufc.GetPath(userFile, site)
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

	err = datasource.DeleteUserFileRecord(userFile, site, sess)
	if err != nil {
		return err
	}

	return nil
}
