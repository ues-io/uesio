package bulk

import (
	"encoding/json"

	"github.com/Pallinder/go-randomdata"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// NewJob func
func NewJob(spec *metadata.JobSpec, session *sess.Session) (string, error) {

	site := session.GetSite()

	str, err := json.Marshal(spec)
	if err != nil {
		return "", err
	}

	jobs := metadata.BulkJobCollection{
		metadata.BulkJob{
			Spec:       string(str),
			Site:       site.Name,
			Collection: spec.Collection,
			Name:       randomdata.SillyName(),
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
