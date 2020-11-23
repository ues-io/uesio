package bulk

import (
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// NewJob func
func NewJob(spec *metadata.JobSpec, session *sess.Session) (string, error) {

	site := session.GetSite()

	jobs := metadata.BulkJobCollection{
		{
			Spec: *spec,
			Site: site.Name,
		},
	}

	responses, err := datasource.PlatformSave([]datasource.PlatformSaveRequest{
		{
			Collection: &jobs,
		},
	}, session)
	if err != nil {
		return "", err
	}

	response := responses[0]
	result := response.ChangeResults["0"]
	newID := result.Data["uesio.id"].(string)

	return newID, nil
}
