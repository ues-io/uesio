package filesource

import (
	"errors"
	"io"
	"mime"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

const PLATFORM_FILE_SOURCE = "uesio/core.platform"

func GetFileType(details *fileadapt.FileDetails) string {
	if details.FieldID == "" {
		return "attachment"
	}
	return "field:" + details.FieldID
}

func getUploadMetadataResponse(metadataResponse *adapt.MetadataCache, collectionID, fieldID string, session *sess.Session) error {
	collections := datasource.MetadataRequest{}

	if fieldID != "" {
		err := collections.AddField(collectionID, fieldID, nil)
		if err != nil {
			return err
		}
	} else {
		err := collections.AddCollection(collectionID)
		if err != nil {
			return err
		}
	}

	return collections.Load(metadataResponse, session, nil)

}

type FileUploadOp struct {
	Data    io.Reader
	Details *fileadapt.FileDetails
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

func Upload(ops []FileUploadOp, connection adapt.Connection, session *sess.Session) ([]*meta.UserFileMetadata, error) {

	ufms := meta.UserFileMetadataCollection{}
	idMaps := map[string]adapt.LocatorMap{}
	fieldUpdates := []datasource.SaveRequest{}
	metadataResponse := &adapt.MetadataCache{}
	// First get create all the metadata
	for _, op := range ops {
		details := op.Details

		ufm := meta.UserFileMetadata{
			CollectionID:  details.CollectionID,
			MimeType:      mime.TypeByExtension(filepath.Ext(details.Path)),
			FieldID:       details.FieldID,
			Path:          details.Path,
			Type:          GetFileType(details),
			RecordID:      details.RecordID,
			ContentLength: details.ContentLength,
			FileSourceID:  PLATFORM_FILE_SOURCE,
		}

		if details.RecordID == "" {
			if details.RecordUniqueKey == "" {
				return nil, errors.New("You must provide either a RecordID, or a RecordUniqueKey for a file upload")
			}
			idMap, ok := idMaps[details.CollectionID]
			if !ok {
				idMap = adapt.LocatorMap{}
				idMaps[details.CollectionID] = idMap
			}
			err := idMap.AddID(details.RecordUniqueKey, adapt.ReferenceLocator{
				Item: &ufm,
			})
			if err != nil {
				return nil, err
			}
		}

		ufms = append(ufms, &ufm)

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
				ufm := match.(*meta.UserFileMetadata)
				idValue, err := item.GetField(adapt.ID_FIELD)
				if err != nil {
					return err
				}
				ufm.RecordID = idValue.(string)
			}
			return nil
		})
		if err != nil {
			return nil, err
		}
	}

	tenantID := session.GetTenantID()

	for index, ufm := range ufms {
		err := getUploadMetadataResponse(metadataResponse, ufm.CollectionID, ufm.FieldID, session)
		if err != nil {
			return nil, err
		}

		fullPath := ufm.GetFullPath(tenantID)

		conn, err := fileadapt.GetFileConnection(ufm.FileSourceID, session)
		if err != nil {
			return nil, err
		}
		err = conn.Upload(ops[index].Data, fullPath)
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
