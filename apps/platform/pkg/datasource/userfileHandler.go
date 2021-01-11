package datasource

import (
	"errors"
	"fmt"
	"mime"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/fileadapters"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getCollectionMetadata(collectionName string, fieldID string, session *sess.Session) (*adapters.CollectionMetadata, error) {
	collatedMetadata := map[string]*adapters.MetadataCache{}
	metadataResponse := adapters.MetadataCache{}
	// Keep a running tally of all requested collections
	collections := MetadataRequest{}
	err := collections.AddCollection(collectionName)
	if err != nil {
		return nil, err
	}
	err = collections.AddField(collectionName, fieldID, nil)
	if err != nil {
		return nil, err
	}

	err = collections.Load(&metadataResponse, collatedMetadata, session)
	if err != nil {
		return nil, err
	}
	meta, ok := metadataResponse.Collections[collectionName]
	if !ok {
		return nil, errors.New("Failed to retrieve metadata for collection")
	}
	return meta, nil
}

//UpdateRecordFieldWithFileID function
func UpdateRecordFieldWithFileID(id string, details FileDetails, session *sess.Session) error {

	changes := map[string]adapters.ChangeRequest{}
	changeRequest := adapters.ChangeRequest{
		FieldChanges: map[string]interface{}{},
	}
	meta, err := getCollectionMetadata(details.CollectionID, details.FieldID, session)
	if err != nil {
		return err
	}
	changeRequest.FieldChanges[details.FieldID] = id
	changeRequest.FieldChanges[meta.IDField] = details.RecordID
	changes["0"] = changeRequest

	saveRequestBatch := &SaveRequestBatch{
		Wires: []adapters.SaveRequest{
			{
				Collection: details.CollectionID,
				Wire:       "filefieldupdate",
				Changes:    changes,
			},
		},
	}
	_, err = Save(*saveRequestBatch, session)
	if err != nil {
		return errors.New("Failed to update field for the given file: " + err.Error())
	}
	return nil
}

// GetUserFile function
func GetUserFile(userFileID string, session *sess.Session) (*metadata.UserFileMetadata, error) {
	var userfile metadata.UserFileMetadata
	err := PlatformLoadOne(
		&userfile,
		[]adapters.LoadRequestCondition{
			{
				Field: "uesio.id",
				Value: userFileID,
			},
		},
		session,
	)
	if err != nil {
		return nil, err
	}

	return &userfile, nil
}

func getFieldIDPart(details FileDetails) string {
	fieldID := details.FieldID
	if fieldID == "" {
		return "attachment_" + details.Name
	}
	return "field_" + fieldID
}

// CreateUserFileMetadataEntry func
func CreateUserFileMetadataEntry(details FileDetails, session *sess.Session) (string, error) {
	site := session.GetSite()

	workspaceID := session.GetWorkspaceID()

	fieldID := getFieldIDPart(details)

	mimeType := mime.TypeByExtension(filepath.Ext(details.Name))

	ufmc := metadata.UserFileMetadataCollection{
		{
			CollectionID:     details.CollectionID,
			MimeType:         mimeType,
			FieldID:          fieldID,
			FileCollectionID: details.FileCollectionID,
			Name:             details.Name,
			RecordID:         details.RecordID,
			SiteID:           site.Name,
			WorkspaceID:      workspaceID,
		},
	}
	response, err := PlatformSave([]PlatformSaveRequest{
		{
			Collection: &ufmc,
			Options: &adapters.SaveOptions{
				Upsert: &adapters.UpsertOptions{},
			},
		},
	}, session)
	if err != nil {
		return "", err
	}
	results := response[0]
	changes, ok := results.ChangeResults["0"]
	if !ok {
		return "", errors.New("No change results for record creation")
	}
	newID, ok := changes.Data["uesio.id"]

	if !ok {
		return "", errors.New("No data entry")
	}

	return newID.(string), nil
}

func getUserfiles(collectionID string, recordIds []string, session *sess.Session) (*metadata.UserFileMetadataCollection, error) {
	ufmc := metadata.UserFileMetadataCollection{}
	err := PlatformLoad(&ufmc, []adapters.LoadRequestCondition{
		{
			Field:    "uesio.recordid",
			Value:    recordIds,
			Operator: "IN",
		},
		{
			Field:    "uesio.collectionid",
			Value:    collectionID,
			Operator: "=",
		},
	}, session,
	)
	if err != nil {
		return &ufmc, err
	}
	return &ufmc, nil
}

// DeleteUserFileRecord function
func DeleteUserFileRecord(userFile *metadata.UserFileMetadata, session *sess.Session) error {
	deleteReq := map[string]adapters.DeleteRequest{}
	deletePrimary := adapters.DeleteRequest{}
	deletePrimary["uesio.id"] = userFile.ID
	deleteReq[userFile.ID] = deletePrimary
	return PlatformDelete("userfiles", deleteReq, session)
}

// DeleteUserFiles function
// idsToDeleteFilesFor is a mapping of collection ids -> record ids
func DeleteUserFiles(idsToDeleteFilesFor map[string]map[string]bool, session *sess.Session) error {
	site := session.GetSite()

	for collectionID, recordIds := range idsToDeleteFilesFor {
		//Flatten recordIDs
		flatIds := make([]string, 0, len(recordIds))
		for k := range recordIds {
			flatIds = append(flatIds, k)
		}
		userFiles, err := getUserfiles(collectionID, flatIds, session)
		if err != nil {
			return err
		}
		ufcCacheMap := map[string]*metadata.UserFileCollection{}
		fsCacheMap := map[string]*metadata.FileSource{}
		for _, userFile := range *userFiles {
			var ufc *metadata.UserFileCollection
			var fs *metadata.FileSource
			ufc, ufcOk := ufcCacheMap[userFile.FileCollectionID]

			if !ufcOk {
				ufc, fs, err = GetFileSourceAndCollection(userFile.FileCollectionID, session)
				if err != nil {
					return err
				}
				ufcCacheMap[userFile.FileCollectionID] = ufc
				fsCacheMap[userFile.FileCollectionID+":"+ufc.FileSource] = fs

			} else {
				fs = fsCacheMap[userFile.FileCollectionID+":"+ufc.FileSource]
			}

			// TODO: at a later time this seems like a good candidate for "bulkifying"
			// We could do these requests in parallel or even create an file adapter function
			// that could delete multiple files in a single call.
			fa, err := fileadapters.GetFileAdapter(fs.GetAdapterType())
			if err != nil {
				return err
			}
			credentials, err := fs.GetCredentials(site)
			if err != nil {
				return err
			}
			bucket, err := ufc.GetBucket(site)
			if err != nil {
				return err
			}
			path, err := ufc.GetPath(&userFile, site.Name, session.GetWorkspaceID())
			if err != nil {
				return errors.New("No filesource found")
			}
			err = fa.Delete(bucket, path, credentials)
			if err != nil {
				//Since the records have been deleted at this point
				//it's a bit tricky to know what to do here
				//Do we stop deleting other files or do we just keep trucking?
				//I opted to just keep trying to delete the others and just
				//log here if something is up (See below also)
				fmt.Print(err)
				continue
			}
			err = DeleteUserFileRecord(&userFile, session)

			if err != nil {
				//Since the records have been deleted at this point
				//it's a bit tricky to know what to do here
				//Do we stop deleting other files or do we just keep trucking?
				//I opted to just keep trying to delete the others and just
				//log here if something is up (See above also)
				fmt.Print(err)
			}
		}
	}
	return nil
}
