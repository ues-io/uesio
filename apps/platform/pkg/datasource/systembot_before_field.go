package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runFieldBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) {

}

func fieldCheck(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	println(request)
	return nil

	// ids := []string{}
	// for i := range *request.Deletes {
	// 	ids = append(ids, (*request.Deletes)[i].IDValue)
	// }

	// if len(ids) == 0 {
	// 	return nil
	// }
	// // Load all the userfile records
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
	// return nil
}
