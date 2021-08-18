package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// BeforeDeleteAPI type
type BeforeDeleteAPI struct {
	Deletes *DeletesAPI `bot:"deletes"`
	errors  []string
	session *sess.Session
}

func NewBeforeDeleteAPI(deletes *adapt.ChangeItems, metadata *adapt.CollectionMetadata, session *sess.Session) *BeforeDeleteAPI {
	return &BeforeDeleteAPI{
		Deletes: &DeletesAPI{
			deletes:  deletes,
			metadata: metadata,
		},
		session: session,
	}
}

// AddError function
func (bs *BeforeDeleteAPI) AddError(message string) {
	bs.errors = append(bs.errors, message)
}

// HasErrors function
func (bs *BeforeDeleteAPI) HasErrors() bool {
	return len(bs.errors) > 0
}

// GetErrorString function
func (bs *BeforeDeleteAPI) GetErrorString() string {
	return strings.Join(bs.errors, ", ")
}

// DeleteFile function
func (bs *BeforeDeleteAPI) DeleteFiles(ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	// Load all the userfile records
	ufmc := meta.UserFileMetadataCollection{}
	err := PlatformLoad(&ufmc, []adapt.LoadRequestCondition{
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
		adapter, bucket, credentials, err := fileadapt.GetAdapterForUserFile(&ufm, bs.session)
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
