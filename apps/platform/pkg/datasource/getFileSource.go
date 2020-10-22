package datasource

import (
	"errors"
	"os"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// GetFileSourceAndCollection function
func GetFileSourceAndCollection(fileCollectionID string, site *metadata.Site, sess *session.Session) (*metadata.UserFileCollection, *metadata.FileSource, error) {
	ufc, err := metadata.NewUserFileCollection(fileCollectionID)
	if err != nil {
		return nil, nil, errors.New("Failed to create file collection")
	}
	err = bundles.Load(ufc, site, sess)
	if err != nil {
		return nil, nil, errors.New("No file collection found: " + err.Error())
	}
	fs, err := metadata.NewFileSource(ufc.FileSource)
	if err != nil {
		return nil, nil, errors.New("Failed to create file source")
	}
	err = bundles.Load(fs, site, sess)
	if err != nil {
		return nil, nil, errors.New("No file source found")
	}
	if fs.Name == "platform" && fs.Namespace == "uesio" {
		value := os.Getenv("UESIO_LOCAL_FILES")
		if value == "true" {
			fs.TypeRef = "uesio.local"
		}
	}
	return ufc, fs, nil
}
