package fileadapt

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type FileAdapter interface {
	GetFileConnection(context.Context, *wire.Credentials, string) (file.Connection, error)
}

var adapterMap = map[string]FileAdapter{}

func GetFileAdapter(adapterType string, session *sess.Session) (FileAdapter, error) {
	mergedType, err := configstore.Merge(adapterType, session)
	if err != nil {
		return nil, err
	}
	adapter, ok := adapterMap[mergedType]
	if !ok {
		return nil, errors.New("No adapter found of this type: " + adapterType)
	}
	return adapter, nil
}

func RegisterFileAdapter(name string, adapter FileAdapter) {
	adapterMap[name] = adapter
}

func GetFileConnection(fileSourceID string, session *sess.Session) (file.Connection, error) {
	fs, err := meta.NewFileSource(fileSourceID)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(fs, session, nil)
	if err != nil {
		return nil, err
	}

	// Enter into a version context to get these
	// credentials as the datasource's namespace
	versionSession, err := datasource.EnterVersionContext(fs.Namespace, session, nil)
	if err != nil {
		return nil, err
	}

	fileAdapter, err := GetFileAdapter(fs.Type, versionSession)
	if err != nil {
		return nil, err
	}

	credentials, err := datasource.GetCredentials(fs.Credentials, versionSession)
	if err != nil {
		return nil, err
	}

	mergedBucket, err := configstore.Merge(fs.Bucket, versionSession)
	if err != nil {
		return nil, err
	}

	return fileAdapter.GetFileConnection(session.Context(), credentials, mergedBucket)
}
