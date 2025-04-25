package bot

import (
	"errors"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var botDialectMap = map[string]BotDialect{}

func RegisterBotDialect(name string, dialect BotDialect) {
	botDialectMap[name] = dialect
}

func GetBotDialect(botDialectName string) (BotDialect, error) {
	dialectKey, ok := meta.GetBotDialects()[botDialectName]
	if !ok {
		return nil, errors.New("Invalid bot dialect name: " + botDialectName)
	}
	dialect, ok := botDialectMap[dialectKey]
	if !ok {
		return nil, errors.New("No dialect found for this bot: " + botDialectName)
	}
	return dialect, nil
}

type BotDialect interface {
	BeforeSave(bot *meta.Bot, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error
	AfterSave(bot *meta.Bot, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error
	CallBot(bot *meta.Bot, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error)
	CallGeneratorBot(bot *meta.Bot, create bundlestore.FileCreator, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error)
	RouteBot(bot *meta.Bot, route *meta.Route, request *http.Request, connection wire.Connection, session *sess.Session) (*meta.Route, error)
	LoadBot(bot *meta.Bot, op *wire.LoadOp, connection wire.Connection, session *sess.Session) error
	SaveBot(bot *meta.Bot, op *wire.SaveOp, connection wire.Connection, session *sess.Session) error
	RunIntegrationActionBot(bot *meta.Bot, integration *wire.IntegrationConnection, actionName string, params map[string]any) (any, error)
}
