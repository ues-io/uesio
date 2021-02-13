package filesource

import (
	"fmt"
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
		[]adapt.LoadRequestCondition{
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

	fmt.Println("USERFILE")
	fmt.Println(userFile)

	adapter, bucket, credentials, err := fileadapt.GetAdapterForUserFile(&userFile, session)
	if err != nil {
		return nil, nil, err
	}

	content, err := adapter.Download(bucket, userFile.Path, credentials)
	if err != nil {
		return nil, nil, err
	}

	return content, &userFile, nil

}
