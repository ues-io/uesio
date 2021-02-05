package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// CallBotAPI type
type CallBotAPI struct {
	session *sess.Session
	Params  *ParamsAPI `bot:"params"`
}

// Save function
func (cba *CallBotAPI) Save(collection string, changes adapt.Collection) error {
	return Save([]SaveRequest{
		{
			Collection: collection,
			Wire:       "apicallbot",
			Changes:    &changes,
		},
	}, cba.session)
}
