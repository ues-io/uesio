package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// BeforeInsertAPI type
type BeforeInsertAPI struct {
	Changes *ChangesAPI `bot:"changes"`
	errors  []string
	session *sess.Session
}

func NewBeforeInsertAPI(changes *adapt.ChangeItems, metadata *adapt.CollectionMetadata, session *sess.Session) *BeforeInsertAPI {
	return &BeforeInsertAPI{
		Changes: &ChangesAPI{
			changes:  changes,
			metadata: metadata,
		},
		session: session,
	}
}

// AddError function
func (bs *BeforeInsertAPI) AddError(message string) {
	bs.errors = append(bs.errors, message)
}

// HasErrors function
func (bs *BeforeInsertAPI) HasErrors() bool {
	return len(bs.errors) > 0
}

// GetErrorString function
func (bs *BeforeInsertAPI) GetErrorString() string {
	return strings.Join(bs.errors, ", ")
}

// DeleteFile function
func (bs *BeforeInsertAPI) DeleteFiles(ids []string) error {
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
