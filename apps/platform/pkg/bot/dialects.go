package bot

import (
	"context"
	"fmt"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var botDialectMap = map[string]BotDialect{}

func RegisterBotDialect(name string, dialect BotDialect) {
	// TODO: This needs to be synchronized!
	botDialectMap[name] = dialect
}

func GetBotDialect(botDialectName string) (BotDialect, error) {
	// TODO: This needs to be synchronized!
	dialectKey, ok := meta.GetBotDialects()[botDialectName]
	if !ok {
		return nil, fmt.Errorf("invalid bot dialect name: %s", botDialectName)
	}
	dialect, ok := botDialectMap[dialectKey]
	if !ok {
		return nil, fmt.Errorf("no dialect found for this bot: %s", botDialectName)
	}
	return dialect, nil
}

type BotDialect interface {
	BeforeSave(ctx context.Context, bot *meta.Bot, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error
	AfterSave(ctx context.Context, bot *meta.Bot, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error
	CallBot(ctx context.Context, bot *meta.Bot, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error)
	CallGeneratorBot(ctx context.Context, bot *meta.Bot, create bundlestore.FileCreator, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error)
	RouteBot(ctx context.Context, bot *meta.Bot, route *meta.Route, request *http.Request, connection wire.Connection, session *sess.Session) (*meta.Route, error)
	LoadBot(ctx context.Context, bot *meta.Bot, op *wire.LoadOp, connection wire.Connection, session *sess.Session) error
	SaveBot(ctx context.Context, bot *meta.Bot, op *wire.SaveOp, connection wire.Connection, session *sess.Session) error
	RunIntegrationActionBot(ctx context.Context, bot *meta.Bot, integration *wire.IntegrationConnection, actionName string, params map[string]any) (any, error)
}
