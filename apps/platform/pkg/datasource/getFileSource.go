package datasource

import (
	"errors"
	"os"

	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// GetFileSourceAndCollection function
func GetFileSourceAndCollection(fileCollectionID string, session *sess.Session) (*metadata.UserFileCollection, *metadata.FileSource, error) {
	ufc, err := metadata.NewUserFileCollection(fileCollectionID)
	if err != nil {
		return nil, nil, errors.New("Failed to create file collection")
	}
	err = bundles.LoadFromSite(ufc, session)
	if err != nil {
		return nil, nil, errors.New("No file collection found: " + err.Error())
	}
	fs, err := metadata.NewFileSource(ufc.FileSource)
	if err != nil {
		return nil, nil, errors.New("Failed to create file source")
	}
	err = bundles.LoadFromSite(fs, session)
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
