package filesource

import (
	"context"
	"errors"
	"fmt"
	"io"
	"mime"
	"path"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"github.com/thecloudmasters/uesio/pkg/usage"
	"golang.org/x/sync/errgroup"
)

const PLATFORM_FILE_SOURCE = "uesio/core.platform"

func GetFileType(fieldID string) string {
	if fieldID == "" {
		return "attachment"
	}
	return "field:" + fieldID
}

type FileUploadOp struct {
	Data            io.Reader
	RecordUniqueKey string
	Path            string         `json:"name"`
	CollectionID    string         `json:"collectionID"`
	RecordID        string         `json:"recordID"`
	FieldID         string         `json:"fieldID"`
	Params          map[string]any `json:"params"`
}

func getUploadMetadata(metadataResponse *wire.MetadataCache, collectionID, fieldID string) (*wire.CollectionMetadata, *wire.FieldMetadata, error) {
	collectionMetadata, err := metadataResponse.GetCollection(collectionID)
	if err != nil {
		return nil, nil, err
	}

	if fieldID == "" {
		return collectionMetadata, nil, nil
	}

	fieldMetadata, err := collectionMetadata.GetField(fieldID)
	if err != nil {
		return nil, nil, err
	}
	return collectionMetadata, fieldMetadata, nil
}

func Upload(ctx context.Context, ops []*FileUploadOp, connection wire.Connection, session *sess.Session, params map[string]any) ([]*meta.UserFileMetadata, error) {

	var userFileCollection meta.UserFileMetadataCollection
	if len(ops) == 0 {
		return userFileCollection, nil
	}
	idMaps := map[string]wire.LocatorMap{}
	var fieldUpdates []datasource.SaveRequest
	metadataResponse := &wire.MetadataCache{}
	// First get create all the metadata
	for _, op := range ops {

		err := datasource.GetMetadataResponse(metadataResponse, op.CollectionID, op.FieldID, session)
		if err != nil {
			return nil, err
		}

		if op.RecordID == "" {
			if op.RecordUniqueKey == "" {
				return nil, errors.New("you must provide either a RecordID, or a RecordUniqueKey for a file upload")
			}
			idMap, ok := idMaps[op.CollectionID]
			if !ok {
				idMap = wire.LocatorMap{}
				idMaps[op.CollectionID] = idMap
			}
			err := idMap.AddID(op.RecordUniqueKey, wire.ReferenceLocator{
				Item: op,
			})
			if err != nil {
				return nil, err
			}
		}

	}

	// Go get any Record IDs that we're missing
	for collectionKey := range idMaps {

		idMap := idMaps[collectionKey]
		err := datasource.LoadLooper(connection, collectionKey, idMap, []wire.LoadRequestField{
			{
				ID: commonfields.Id,
			},
			{
				ID: commonfields.UniqueKey,
			},
		}, commonfields.UniqueKey, metadataResponse, session, func(item meta.Item, matchIndexes []wire.ReferenceLocator, ID string) error {

			if item == nil {
				return fmt.Errorf("could not match upload on unique key: %s", ID)
			}
			//One collection with more than 1 fields of type File
			for i := range matchIndexes {
				match := matchIndexes[i].Item
				op := match.(*FileUploadOp)
				idValue, err := item.GetField(commonfields.Id)
				if err != nil {
					return err
				}
				op.RecordID = idValue.(string)
			}
			return nil
		})
		if err != nil {
			return nil, err
		}
	}

	tenantID := session.GetTenantID()

	fileSourceConnections := make(map[string][]file.FileUploadRequest)
	for _, op := range ops {

		ufm := &meta.UserFileMetadata{
			CollectionID: op.CollectionID,
			MimeType:     mime.TypeByExtension(path.Ext(op.Path)),
			FieldID:      op.FieldID,
			FilePath:     op.Path,
			Type:         GetFileType(op.FieldID),
			RecordID:     op.RecordID,
			FileSourceID: PLATFORM_FILE_SOURCE,
		}
		userFileCollection = append(userFileCollection, ufm)
		fileSourceConnections[ufm.FileSourceID] = append(fileSourceConnections[ufm.FileSourceID], userFileUploadRequest{op.Data, ufm.GetFullPath(tenantID), ufm})
	}

	g, _ := errgroup.WithContext(session.Context())
	for fileSourceID, reqs := range fileSourceConnections {
		g.Go(func() error {
			conn, err := fileadapt.GetFileConnection(fileSourceID, session)
			if err != nil {
				return err
			}
			writtenResults, err := conn.UploadMany(ctx, reqs)
			if err != nil {
				return err
			}

			for i, req := range reqs {
				ufur, ok := req.(userFileUploadRequest)
				if !ok {
					return fmt.Errorf("expected UserFileUploadRequest, got %T", req)
				}
				written := writtenResults[i]
				ufur.Meta.FileContentLength = written
				usage.RegisterEvent("UPLOAD", "FILESOURCE", ufur.Meta.FileSourceID, 0, session)
				usage.RegisterEvent("UPLOAD_BYTES", "FILESOURCE", ufur.Meta.FileSourceID, written, session)
			}

			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}

	err := datasource.PlatformSave(datasource.PlatformSaveRequest{
		Collection: &userFileCollection,
		Options: &wire.SaveOptions{
			Upsert: true,
		},
		Params: params,
	}, connection, session)
	if err != nil {
		return nil, err
	}

	for _, ufm := range userFileCollection {

		_, fieldMetadata, err := getUploadMetadata(metadataResponse, ufm.CollectionID, ufm.FieldID)
		if err != nil {
			return nil, err
		}

		// Collect the record field update saves
		if fieldMetadata != nil {

			if fieldMetadata.Type != "FILE" {
				return nil, errors.New("can only attach files to FILE fields")
			}
			fieldUpdates = append(fieldUpdates, datasource.SaveRequest{
				Collection: ufm.CollectionID,
				Wire:       "filefieldupdate",
				Changes: &wire.Collection{
					{
						ufm.FieldID: map[string]any{
							commonfields.Id: ufm.ID,
						},
						commonfields.Id: ufm.RecordID,
					},
				},
				Params: params,
				Options: &wire.SaveOptions{
					Upsert: true,
				},
			})
		}

	}

	err = datasource.SaveWithOptions(fieldUpdates, session, datasource.NewSaveOptions(connection, metadataResponse))
	if err != nil {
		return nil, fmt.Errorf("failed to update field for the given file: %w", err)
	}

	return userFileCollection, nil
}

type userFileUploadRequest struct {
	data io.Reader
	path string

	Meta *meta.UserFileMetadata
}

func (r userFileUploadRequest) Data() io.Reader {
	return r.data
}

func (r userFileUploadRequest) Path() string {
	return r.path
}
