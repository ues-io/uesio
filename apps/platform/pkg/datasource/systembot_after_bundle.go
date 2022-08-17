package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runBundlenAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	println("Running After Bundle")
	return cleanBundleFiles(request, connection, session)

}

func cleanBundleFiles(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	ids := []string{}
	for i := range request.Deletes {
		ids = append(ids, request.Deletes[i].IDValue)
	}

	if len(ids) == 0 {
		return nil
	}

	//
	workspace := session.GetWorkspace()

	if workspace == nil {
		return errors.New("Error deliting bundle, missing workspace")
	}

	//

	dest, err := bundlestore.GetBundleStore(workspace.Name, session.RemoveWorkspaceContext())
	if err != nil {
		return err
	}

	dest.DeleteBundle()

	// Load all the userfile records
	// ufmc := meta.UserFileMetadataCollection{}
	// err := PlatformLoad(&ufmc, &PlatformLoadOptions{
	// 	Conditions: []adapt.LoadRequestCondition{
	// 		{
	// 			Field:    adapt.ID_FIELD,
	// 			Value:    ids,
	// 			Operator: "IN",
	// 		},
	// 	},
	// 	Connection: connection,
	// }, session)
	// if err != nil {
	// 	return err
	// }

	// for i := range ufmc {
	// 	ufm := ufmc[i]

	// 	_, fs, err := fileadapt.GetFileSourceAndCollection(ufm.FileCollectionID, session)
	// 	if err != nil {
	// 		return err
	// 	}
	// 	conn, err := fileadapt.GetFileConnection(fs.GetKey(), session)
	// 	if err != nil {
	// 		return err
	// 	}

	// 	err = conn.Delete(ufm.Path)
	// 	if err != nil {
	// 		return err
	// 	}
	// }
	return nil
}
