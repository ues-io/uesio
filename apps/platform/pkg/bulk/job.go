package bulk

import (
	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// NewJob func
func NewJob(spec *metadata.JobSpec, site *metadata.Site, sess *session.Session) (string, error) {

	jobs := metadata.BulkJobCollection{
		metadata.BulkJob{
			Spec: *spec,
			Site: site.Name,
		},
	}

	responses, err := datasource.PlatformSave([]datasource.PlatformSaveRequest{
		{
			Collection: &jobs,
		},
	}, site, sess)
	if err != nil {
		return "", err
	}

	response := responses[0]
	result := response.ChangeResults["0"]
	newID := result.Data["uesio.id"].(string)

	return newID, nil
}
