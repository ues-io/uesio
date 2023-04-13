package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runUserFileBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	// If a user file is being deleted, we want to delete the underlying file blob data as well
	// using the configured file storage adapter
	userFileIdsBeingDeleted := []string{}
	// If a user file is being attached to a Studio file, we need to delete all other
	for i := range request.Deletes {
		userFileIdsBeingDeleted = append(userFileIdsBeingDeleted, request.Deletes[i].IDValue)
	}

	// Perform related blob file deletions, if necessary
	if len(userFileIdsBeingDeleted) > 0 {
		// Load all the userfile records
		ufmc := meta.UserFileMetadataCollection{}
		err := datasource.PlatformLoad(&ufmc, &datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    adapt.ID_FIELD,
					Value:    userFileIdsBeingDeleted,
					Operator: "IN",
				},
			},
			Connection: connection,
		}, session)
		if err != nil {
			return err
		}

		tenantID := session.GetTenantID()

		for i := range ufmc {
			ufm := ufmc[i]

			conn, err := fileadapt.GetFileConnection(ufm.FileSourceID, session)
			if err != nil {
				return err
			}

			fullPath := ufm.GetFullPath(tenantID)

			err = conn.Delete(fullPath)
			if err != nil {
				return err
			}
		}
	}

	return nil

}
