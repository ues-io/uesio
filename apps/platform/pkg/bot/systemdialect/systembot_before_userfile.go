package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runUserFileBeforeSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	// If a user file is being deleted, we want to delete the underlying file blob data as well
	// using the configured file storage adapter
	var userFileIdsBeingDeleted []string
	// If a user file is being attached to a Studio file, we need to delete all other
	for i := range request.Deletes {
		userFileIdsBeingDeleted = append(userFileIdsBeingDeleted, request.Deletes[i].IDValue)
	}

	// Perform related blob file deletions, if necessary
	if len(userFileIdsBeingDeleted) > 0 {
		// Load all the userfile records
		ufmc := meta.UserFileMetadataCollection{}
		err := datasource.PlatformLoad(&ufmc, &datasource.PlatformLoadOptions{
			Conditions: []wire.LoadRequestCondition{
				{
					Field:    wire.ID_FIELD,
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

		// Build a map of file connections by source,
		// to prevent acquiring a separate connection for every file we are deleting
		fileConnectionsBySource := map[string]file.Connection{}

		for i := range ufmc {
			ufm := ufmc[i]

			conn, isPresent := fileConnectionsBySource[ufm.FileSourceID]
			if !isPresent {
				conn, err = fileadapt.GetFileConnection(ufm.FileSourceID, session)
				if err != nil {
					return err
				}
				fileConnectionsBySource[ufm.FileSourceID] = conn
			}
			fullPath := ufm.GetFullPath(tenantID)
			// Ignore missing files, possibly it was already deleted
			_ = conn.Delete(fullPath)
		}
	}

	return nil

}
