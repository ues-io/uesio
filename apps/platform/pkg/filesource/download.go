package filesource

import (
	"context"
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

func DownloadAttachment(ctx context.Context, recordID string, path string, session *sess.Session) (io.ReadSeekCloser, *meta.UserFileMetadata, error) {

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
		return nil, nil, err
	}

	return DownloadItem(ctx, userFile, session)
}

func Download(ctx context.Context, userFileID string, session *sess.Session) (io.ReadSeekCloser, *meta.UserFileMetadata, error) {

	userFile := &meta.UserFileMetadata{}
	err := datasource.PlatformLoadOne(
		userFile,
		&datasource.PlatformLoadOptions{
			Fields: []wire.LoadRequestField{
				// Don't request all fields, otherwise we end up loading in a bunch of References that we don't need
				{
					ID: "uesio/core.fieldid",
				},
				{
					ID: "uesio/core.recordid",
				},
				{
					ID: "uesio/core.path",
				},
				{
					ID: "uesio/core.collectionid",
				},
				{
					ID: "uesio/core.filesourceid",
				},
				{
					ID: "uesio/core.type",
				},
				{
					ID: "uesio/core.mimetype",
				},
				{
					ID: "uesio/core.updatedat",
				},
			},
			Conditions: []wire.LoadRequestCondition{
				{
					Field: commonfields.Id,
					Value: userFileID,
				},
			},
		},
		session,
	)
	if err != nil {
		return nil, nil, err
	}

	return DownloadItem(ctx, userFile, session)
}

func DownloadItem(ctx context.Context, userFile *meta.UserFileMetadata, session *sess.Session) (io.ReadSeekCloser, *meta.UserFileMetadata, error) {

	if userFile == nil {
		return nil, nil, errors.New("no file provided")
	}

	conn, err := fileadapt.GetFileConnection(userFile.FileSourceID, session)
	if err != nil {
		return nil, nil, err
	}

	fullPath := userFile.GetFullPath(session.GetTenantID())

	r, _, err := conn.Download(ctx, fullPath)
	if err != nil {
		return nil, nil, err
	}

	usage.RegisterEvent("DOWNLOAD", "FILESOURCE", userFile.FileSourceID, 0, session)
	usage.RegisterEvent("DOWNLOAD_BYTES", "FILESOURCE", userFile.FileSourceID, userFile.ContentLength(), session)

	return r, userFile, nil
}
