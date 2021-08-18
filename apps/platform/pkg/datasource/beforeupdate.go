package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// BeforeUpdateAPI type
type BeforeUpdateAPI struct {
	Updates *UpdatesAPI `bot:"updates"`
	errors  []string
	session *sess.Session
}

func NewBeforeUpdateAPI(changes *adapt.ChangeItems, metadata *adapt.CollectionMetadata, session *sess.Session) *BeforeUpdateAPI {
	return &BeforeUpdateAPI{
		Updates: &UpdatesAPI{
			updates:  changes,
			metadata: metadata,
		},
		session: session,
	}
}

// AddError function
func (bs *BeforeUpdateAPI) AddError(message string) {
	bs.errors = append(bs.errors, message)
}

// HasErrors function
func (bs *BeforeUpdateAPI) HasErrors() bool {
	return len(bs.errors) > 0
}

// GetErrorString function
func (bs *BeforeUpdateAPI) GetErrorString() string {
	return strings.Join(bs.errors, ", ")
}
