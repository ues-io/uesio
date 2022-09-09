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
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/usage/register"
)

func GetFileMetadataType(details *fileadapt.FileDetails) string {
	if details.FieldID == "" {
		return "attachment"
	}
	return "field"
}

func GetFileUniqueName(details *fileadapt.FileDetails) string {
	if details.FieldID == "" {
		return details.Name
	}
	return details.FieldID
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

	return collections.Load(metadataResponse, session)

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
			CollectionID: details.CollectionID,
			MimeType:     mime.TypeByExtension(filepath.Ext(details.Name)),
			FieldID:      details.FieldID,
			Type:         GetFileMetadataType(details),
			FileName:     details.Name,
			Name:         GetFileUniqueName(details), // Different for file fields and attachments
			RecordID:     details.RecordID,
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
			idMap.AddID(details.RecordUniqueKey, adapt.ReferenceLocator{
				Item: &ufm,
			})
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
		}, adapt.UNIQUE_KEY_FIELD, false, func(item loadable.Item, matchIndexes []adapt.ReferenceLocator) error {
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

	for index, ufm := range ufms {
		err := getUploadMetadataResponse(metadataResponse, ufm.CollectionID, ufm.FieldID, session)
		if err != nil {
			return nil, err
		}

		collectionMetadata, fieldMetadata, err := getUploadMetadata(metadataResponse, ufm.CollectionID, ufm.FieldID)
		if err != nil {
			return nil, err
		}

		fileCollectionID, err := fileadapt.GetFileCollectionID(collectionMetadata, fieldMetadata)
		if err != nil {
			return nil, err
		}

		ufc, fs, err := fileadapt.GetFileSourceAndCollection(fileCollectionID, session)
		if err != nil {
			return nil, err
		}

		path, err := ufc.GetFilePath(ufm)
		if err != nil {
			return nil, errors.New("error generating path for userfile: " + err.Error())
		}

		ufm.Path = path
		ufm.FileCollectionID = fileCollectionID

		conn, err := fileadapt.GetFileConnection(fs.GetKey(), session)
		if err != nil {
			return nil, err
		}
		err = conn.Upload(ops[index].Data, path)
		if err != nil {
			return nil, err
		}

		go register.UsageEvent("UPLOAD", "FILESOURCE", fs.GetKey(), session)

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
