package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/fileadapters"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// BeforeSaveAPI type
type BeforeSaveAPI struct {
	Changes *ChangesAPI `bot:"changes"`
	Deletes *DeletesAPI `bot:"deletes"`
	errors  []string
	session *sess.Session
}

func NewBeforeSaveAPI(request *adapters.SaveRequest, metadata *adapters.CollectionMetadata, session *sess.Session) *BeforeSaveAPI {
	return &BeforeSaveAPI{
		Changes: &ChangesAPI{
			changes:  request.Changes,
			metadata: metadata,
		},
		Deletes: &DeletesAPI{
			deletes: request.Deletes,
		},
		session: session,
	}
}

// AddError function
func (bs *BeforeSaveAPI) AddError(message string) {
	bs.errors = append(bs.errors, message)
}

// HasErrors function
func (bs *BeforeSaveAPI) HasErrors() bool {
	return len(bs.errors) > 0
}

// GetErrorString function
func (bs *BeforeSaveAPI) GetErrorString() string {
	return strings.Join(bs.errors, ", ")
}

// DeleteFile function
func (bs *BeforeSaveAPI) DeleteFiles(ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	// Load all the userfile records
	ufmc := metadata.UserFileMetadataCollection{}
	err := PlatformLoad(&ufmc, []adapters.LoadRequestCondition{
		{
			Field:    "uesio.id",
			Value:    ids,
			Operator: "IN",
		},
	}, bs.session,
	)
	if err != nil {
		return err
	}

	for i := range ufmc {
		ufm := ufmc[i]
		adapter, bucket, credentials, err := fileadapters.GetAdapterForUserFile(&ufm, bs.session)
		if err != nil {
			return err
		}
		err = adapter.Delete(bucket, ufm.Path, credentials)
		if err != nil {
			return err
		}
	}
	return nil

}
