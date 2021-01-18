package filesource

import (
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapters"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Download function
func Download(userFileID string, session *sess.Session) (io.ReadCloser, *metadata.UserFileMetadata, error) {

	userFile := metadata.UserFileMetadata{}
	err := datasource.PlatformLoadOne(
		&userFile,
		[]adapters.LoadRequestCondition{
			{
				Field: "uesio.id",
				Value: userFileID,
			},
		},
		session,
	)
	if err != nil {
		return nil, nil, err
	}

	adapter, bucket, credentials, err := fileadapters.GetAdapterForUserFile(&userFile, session)
	if err != nil {
		return nil, nil, err
	}

	content, err := adapter.Download(bucket, userFile.Path, credentials)
	if err != nil {
		return nil, nil, err
	}

	return content, &userFile, nil

}
