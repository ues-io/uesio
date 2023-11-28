package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type BeforeSaveAPI struct {
	Inserts    *InsertsAPI `bot:"inserts"`
	Updates    *UpdatesAPI `bot:"updates"`
	Deletes    *DeletesAPI `bot:"deletes"`
	LogApi     *BotLogAPI  `bot:"log"`
	op         *adapt.SaveOp
	session    *sess.Session
	connection adapt.Connection
}

func NewBeforeSaveAPI(bot *meta.Bot, op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) *BeforeSaveAPI {
	return &BeforeSaveAPI{
		Inserts:    &InsertsAPI{op},
		Updates:    &UpdatesAPI{op},
		Deletes:    &DeletesAPI{op},
		LogApi:     NewBotLogAPI(bot),
		session:    session,
		op:         op,
		connection: connection,
	}
}

func (bs *BeforeSaveAPI) AddError(message string) {
	bs.op.AddError(adapt.NewSaveError("", "", message))
}

func (bs *BeforeSaveAPI) Load(request BotLoadOp) (*adapt.Collection, error) {
	return botLoad(request, bs.session, bs.connection)
}

func (bs *BeforeSaveAPI) CallBot(botKey string, params map[string]interface{}) (interface{}, error) {
	return botCall(botKey, params, bs.session, bs.connection)
}
