package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runUserFileBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return cleanUserFiles(request, connection, session)
}

func cleanUserFiles(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

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

	for i := range ufmc {
		ufm := ufmc[i]

		fs, err := fileadapt.GetFileSource(ufm.FileSourceID, session)
		if err != nil {
			return err
		}
		conn, err := fileadapt.GetFileConnection(fs.GetKey(), session)
		if err != nil {
			return err
		}

		err = conn.Delete(ufm.Path)
		if err != nil {
			return err
		}
	}
	return nil
}
