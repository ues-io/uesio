package filesource

import (
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

func DownloadAttachment(recordID string, path string, session *sess.Session) (io.ReadCloser, *meta.UserFileMetadata, error) {

	userFile := &meta.UserFileMetadata{}
	err := datasource.PlatformLoadOne(
		userFile,
		&datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/core.recordid",
					Value: recordID,
				},
				{
					Field: "uesio/core.path",
					Value: path,
				},
			},
		},
		session,
	)
	if err != nil {
		return nil, nil, err
	}

	return DownloadItem(userFile, session)
}

func Download(userFileID string, session *sess.Session) (io.ReadCloser, *meta.UserFileMetadata, error) {

	userFile := &meta.UserFileMetadata{}
	err := datasource.PlatformLoadOne(
		userFile,
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

	return DownloadItem(userFile, session)
}

func DownloadItem(userFile *meta.UserFileMetadata, session *sess.Session) (io.ReadCloser, *meta.UserFileMetadata, error) {

	conn, err := fileadapt.GetFileConnection(userFile.FileSourceID, session)
	if err != nil {
		return nil, nil, err
	}

	fullPath := userFile.GetFullPath(session.GetTenantID())

	_, content, err := conn.Download(fullPath)
	if err != nil {
		return nil, nil, err
	}

	usage.RegisterEvent("DOWNLOAD", "FILESOURCE", userFile.FileSourceID, 0, session)
	usage.RegisterEvent("DOWNLOAD_BYTES", "FILESOURCE", userFile.FileSourceID, userFile.ContentLength, session)

	return content, userFile, nil
}
