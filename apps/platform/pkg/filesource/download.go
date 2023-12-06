package filesource

import (
	"io"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

func DownloadAttachment(w io.Writer, recordID string, path string, session *sess.Session) (*meta.UserFileMetadata, error) {

	userFile := &meta.UserFileMetadata{}
	err := datasource.PlatformLoadOne(
		userFile,
		&datasource.PlatformLoadOptions{
			Conditions: []wire.LoadRequestCondition{
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
		return nil, err
	}

	return DownloadItem(w, userFile, session)
}

func Download(w io.Writer, userFileID string, session *sess.Session) (*meta.UserFileMetadata, error) {

	userFile := &meta.UserFileMetadata{}
	err := datasource.PlatformLoadOne(
		userFile,
		&datasource.PlatformLoadOptions{
			Conditions: []wire.LoadRequestCondition{
				{
					Field: wire.ID_FIELD,
					Value: userFileID,
				},
			},
		},
		session,
	)
	if err != nil {
		return nil, err
	}

	return DownloadItem(w, userFile, session)
}

func DownloadItem(w io.Writer, userFile *meta.UserFileMetadata, session *sess.Session) (*meta.UserFileMetadata, error) {

	conn, err := fileadapt.GetFileConnection(userFile.FileSourceID, session)
	if err != nil {
		return nil, err
	}

	fullPath := userFile.GetFullPath(session.GetTenantID())

	_, err = conn.Download(w, fullPath)
	if err != nil {
		return nil, err
	}

	usage.RegisterEvent("DOWNLOAD", "FILESOURCE", userFile.FileSourceID, 0, session)
	usage.RegisterEvent("DOWNLOAD_BYTES", "FILESOURCE", userFile.FileSourceID, userFile.ContentLength, session)

	return userFile, nil
}
