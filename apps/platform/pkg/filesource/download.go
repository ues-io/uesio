package filesource

import (
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Download function
func Download(userFileID string, session *sess.Session) (io.ReadCloser, *meta.UserFileMetadata, error) {

	userFile := meta.UserFileMetadata{}
	err := datasource.PlatformLoadOne(
		&userFile,
		&datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: adapt.ID_FIELD,
					Value: userFileID,
				},
			},
		},
		session,
	)
	if err != nil {
		return nil, nil, err
	}

	_, fs, err := fileadapt.GetFileSourceAndCollection(userFile.CollectionID, session)
	if err != nil {
		return nil, nil, err
	}

	conn, err := fileadapt.GetFileConnection(fs.GetKey(), session)
	if err != nil {
		return nil, nil, err
	}

	content, err := conn.Download(userFile.Path)
	if err != nil {
		return nil, nil, err
	}

	return content, &userFile, nil

}
