package datasource

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapters"
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

	err = collections.Load(nil, &metadataResponse, collatedMetadata, session)
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

// DeleteUserFiles function
// idsToDeleteFilesFor is a mapping of collection ids -> record ids
func DeleteUserFiles(idsToDeleteFilesFor map[string]map[string]bool, session *sess.Session) error {

	for collectionID, recordIds := range idsToDeleteFilesFor {
		//Flatten recordIDs
		flatIds := make([]string, 0, len(recordIds))
		for k := range recordIds {
			flatIds = append(flatIds, k)
		}

		userFiles := metadata.UserFileMetadataCollection{}
		err := PlatformLoad(&userFiles, []adapters.LoadRequestCondition{
			{
				Field:    "uesio.recordid",
				Value:    flatIds,
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
			return err
		}

		for _, userFile := range userFiles {
			deleteReq := map[string]adapters.DeleteRequest{}
			deletePrimary := adapters.DeleteRequest{}
			deletePrimary["uesio.id"] = userFile.ID
			deleteReq[userFile.ID] = deletePrimary
			err := PlatformDelete("userfiles", deleteReq, session)
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
