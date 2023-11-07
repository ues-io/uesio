package filesource

import (
	"errors"
	"io"
	"mime"
	"path"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

const PLATFORM_FILE_SOURCE = "uesio/core.platform"

func GetFileType(op *FileUploadOp) string {
	if op.FieldID == "" {
		return "attachment"
	}
	return "field:" + op.FieldID
}

type FileUploadOp struct {
	Data            io.Reader
	RecordUniqueKey string
	ContentLength   int64
	Path            string            `json:"name"`
	CollectionID    string            `json:"collectionID"`
	RecordID        string            `json:"recordID"`
	FieldID         string            `json:"fieldID"`
	Overwrite       bool              `json:"overwrite"`
	Params          map[string]string `json:"params"`
}

func getUploadMetadata(metadataResponse *adapt.MetadataCache, collectionID, fieldID string) (*adapt.CollectionMetadata, *adapt.FieldMetadata, error) {
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

func Upload(ops []*FileUploadOp, connection adapt.Connection, session *sess.Session, params map[string]string) ([]*meta.UserFileMetadata, error) {

	ufms := meta.UserFileMetadataCollection{}
	idMaps := map[string]adapt.LocatorMap{}
	fieldUpdates := []datasource.SaveRequest{}
	metadataResponse := &adapt.MetadataCache{}
	// First get create all the metadata
	for _, op := range ops {

		if op.RecordID == "" {
			if op.RecordUniqueKey == "" {
				return nil, errors.New("You must provide either a RecordID, or a RecordUniqueKey for a file upload")
			}
			idMap, ok := idMaps[op.CollectionID]
			if !ok {
				idMap = adapt.LocatorMap{}
				idMaps[op.CollectionID] = idMap
			}
			err := idMap.AddID(op.RecordUniqueKey, adapt.ReferenceLocator{
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
		err := adapt.LoadLooper(connection, collectionKey, idMap, []adapt.LoadRequestField{
			{
				ID: adapt.ID_FIELD,
			},
			{
				ID: adapt.UNIQUE_KEY_FIELD,
			},
		}, adapt.UNIQUE_KEY_FIELD, session, func(item meta.Item, matchIndexes []adapt.ReferenceLocator, ID string) error {

			if item == nil {
				return errors.New("Could not match upload on unique key: " + ID)
			}
			//One collection with more than 1 fields of type File
			for i := range matchIndexes {
				match := matchIndexes[i].Item
				op := match.(*FileUploadOp)
				idValue, err := item.GetField(adapt.ID_FIELD)
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

	for _, op := range ops {
		err := datasource.GetMetadataResponse(metadataResponse, op.CollectionID, op.FieldID, session)
		if err != nil {
			return nil, err
		}

		ufm := &meta.UserFileMetadata{
			CollectionID:  op.CollectionID,
			MimeType:      mime.TypeByExtension(path.Ext(op.Path)),
			FieldID:       op.FieldID,
			Path:          op.Path,
			Type:          GetFileType(op),
			RecordID:      op.RecordID,
			ContentLength: op.ContentLength,
			FileSourceID:  PLATFORM_FILE_SOURCE,
		}
		ufms = append(ufms, ufm)

		//before saving the new file, delete all the other attachments
		if op.Overwrite {
			ufmcToDelete := meta.UserFileMetadataCollection{}
			err = datasource.PlatformLoad(
				&ufmcToDelete,
				&datasource.PlatformLoadOptions{
					Conditions: []adapt.LoadRequestCondition{
						{
							Field:    "uesio/core.recordid",
							Operator: "EQ",
							Value:    ufm.RecordID,
						},
					},
				},
				session,
			)

			for _, ufmToDelete := range ufmcToDelete {
				err := Delete(ufmToDelete.ID, session)
				if err != nil {
					return nil, err
				}
			}
		}
		conn, err := fileadapt.GetFileConnection(ufm.FileSourceID, session)
		if err != nil {
			return nil, err
		}
		err = conn.Upload(op.Data, ufm.GetFullPath(tenantID))
		if err != nil {
			return nil, err
		}

		usage.RegisterEvent("UPLOAD", "FILESOURCE", ufm.FileSourceID, 0, session)
		usage.RegisterEvent("UPLOAD_BYTES", "FILESOURCE", ufm.FileSourceID, ufm.ContentLength, session)
	}

	err := datasource.PlatformSave(datasource.PlatformSaveRequest{
		Collection: &ufms,
		Options: &adapt.SaveOptions{
			Upsert: true,
		},
		Params: params,
	}, connection, session)
	if err != nil {
		return nil, err
	}

	for _, ufm := range ufms {

		_, fieldMetadata, err := getUploadMetadata(metadataResponse, ufm.CollectionID, ufm.FieldID)
		if err != nil {
			return nil, err
		}

		// Collect the record field update saves
		if fieldMetadata != nil {

			if fieldMetadata.Type != "FILE" {
				return nil, errors.New("Can only attach files to FILE fields")
			}
			fieldUpdates = append(fieldUpdates, datasource.SaveRequest{
				Collection: ufm.CollectionID,
				Wire:       "filefieldupdate",
				Changes: &adapt.Collection{
					{
						ufm.FieldID: map[string]interface{}{
							adapt.ID_FIELD: ufm.ID,
						},
						adapt.ID_FIELD: ufm.RecordID,
					},
				},
				Params: params,
				Options: &adapt.SaveOptions{
					Upsert: true,
				},
			})
		}

	}

	err = datasource.SaveWithOptions(fieldUpdates, session, datasource.GetConnectionSaveOptions(connection))
	if err != nil {
		return nil, errors.New("Failed to update field for the given file: " + err.Error())
	}

	return ufms, nil
}
