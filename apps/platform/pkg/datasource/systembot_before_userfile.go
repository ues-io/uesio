package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runUserFileBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	ids := []string{}
	for i := range request.Deletes {
		ids = append(ids, request.Deletes[i].IDValue)
	}

	if len(ids) == 0 {
		return nil
	}
	// Load all the userfile records
	ufmc := meta.UserFileMetadataCollection{}
	err := PlatformLoad(&ufmc, &PlatformLoadOptions{
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    adapt.ID_FIELD,
				Value:    ids,
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
	return nil
}
