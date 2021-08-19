package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// BeforeInsertAPI type
type BeforeInsertAPI struct {
	Inserts *InsertsAPI `bot:"inserts"`
	errors  []string
	session *sess.Session
}

func NewBeforeInsertAPI(changes *adapt.ChangeItems, metadata *adapt.CollectionMetadata, session *sess.Session) *BeforeInsertAPI {
	return &BeforeInsertAPI{
		Inserts: &InsertsAPI{
			inserts:  changes,
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
