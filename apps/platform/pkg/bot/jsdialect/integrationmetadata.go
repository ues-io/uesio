package jsdialect

import (
	botutils "github.com/thecloudmasters/uesio/pkg/bot/utils"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type IntegrationMetadata struct {
	connection *wire.IntegrationConnection
}

func (im *IntegrationMetadata) GetBaseURL() (string, error) {
	return botutils.GetBaseURL(im.connection, im.connection.GetSession())
}
