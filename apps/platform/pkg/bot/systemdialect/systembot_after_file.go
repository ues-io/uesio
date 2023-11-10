package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runFileAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	ids := []string{}
	for i := range request.Deletes {
		ids = append(ids, request.Deletes[i].IDValue)
	}

	if len(ids) > 0 {
		ufmcToDelete := meta.UserFileMetadataCollection{}
		datasource.PlatformLoad(
			&ufmcToDelete,
			&datasource.PlatformLoadOptions{
				Conditions: []adapt.LoadRequestCondition{
					{
						Field:    "uesio/core.recordid",
						Value:    ids,
						Operator: "IN",
					},
				},
			},
			session,
		)
		for _, ufmToDelete := range ufmcToDelete {
			filesource.Delete(ufmToDelete.ID, session)
		}
	}

	return nil
}
