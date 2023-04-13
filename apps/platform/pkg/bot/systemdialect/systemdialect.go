package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/clickup"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type BotFunc func(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error

type CallBotFunc func(params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error)

type LoadBotFunc func(request *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error

type RouteBotFunc func(*meta.Route, *sess.Session) error

type SystemDialect struct {
}

func (b *SystemDialect) BeforeSave(bot *meta.Bot, request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	var botFunction BotFunc

	switch request.Metadata.GetFullName() {
	case "uesio/core.userfile":
		botFunction = runUserFileBeforeSaveBot
	case "uesio/studio.field":
		botFunction = runFieldBeforeSaveBot
	case "uesio/studio.view":
		botFunction = runViewBeforeSaveBot
	case "uesio/studio.theme":
		botFunction = runThemeBeforeSaveBot
	case "uesio/studio.route":
		botFunction = runRouteBeforeSaveBot
	case "uesio/studio.collection":
		botFunction = runCollectionBeforeSaveBot
	case "uesio/studio.bot":
		botFunction = runBotBeforeSaveBot
	case "uesio/studio.app":
		botFunction = runAppBeforeSaveBot
	case "uesio/studio.usage":
		botFunction = runUsageBeforeSaveBot
	case "uesio/core.user":
		botFunction = runUserBeforeSaveBot
	}

	if botFunction == nil {
		return nil
	}

	return botFunction(request, connection, session)

}

func (b *SystemDialect) AfterSave(bot *meta.Bot, request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	var botFunction BotFunc

	switch request.Metadata.GetFullName() {
	case "uesio/core.user":
		botFunction = runUserAfterSaveBot
	case "uesio/core.userfile":
		botFunction = runUserFileAfterSaveBot
	case "uesio/studio.site":
		botFunction = runSiteAfterSaveBot
	case "uesio/studio.sitedomain":
		botFunction = runDomainAfterSaveSiteBot
	case "uesio/studio.collection":
		botFunction = runCollectionAfterSaveBot
	case "uesio/studio.field":
		botFunction = runFieldAfterSaveBot
	case "uesio/studio.workspace":
		botFunction = runWorkspaceAfterSaveBot
	case "uesio/studio.bundle":
		botFunction = runBundleAfterSaveBot
	case "uesio/studio.bundledependency":
		botFunction = runBundleDependencyAfterSaveBot
	case "uesio/studio.license":
		botFunction = runLicenseAfterSaveBot
	case "uesio/studio.bot":
		botFunction = runBotAfterSaveBot
	}

	if botFunction == nil {
		return nil
	}

	return botFunction(request, connection, session)

}

func (b *SystemDialect) CallBot(bot *meta.Bot, params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {
	var botFunction CallBotFunc

	switch bot.GetKey() {
	case "listener:uesio/studio.createbundle":
		botFunction = runCreateBundleListenerBot
	case "listener:uesio/studio.makepayment":
		botFunction = runMakePaymentListenerBot
	}

	if botFunction == nil {
		return nil, datasource.NewSystemBotNotFoundError()
	}

	return botFunction(params, connection, session)

}

func (b *SystemDialect) CallGeneratorBot(bot *meta.Bot, create retrieve.WriterCreator, params map[string]interface{}, connection adapt.Connection, session *sess.Session) error {
	return nil
}

func (b *SystemDialect) RouteBot(bot *meta.Bot, route *meta.Route, session *sess.Session) error {
	var botFunction RouteBotFunc

	routeKey := route.GetKey()

	switch routeKey {
	case "uesio/studio.paymentsuccess":
		botFunction = runPaymentSuccessRouteBot
	}

	if botFunction == nil {
		return datasource.NewSystemBotNotFoundError()
	}

	return botFunction(route, session)

}

func (b *SystemDialect) LoadBot(bot *meta.Bot, op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {
	var botFunction LoadBotFunc

	switch op.CollectionName {
	case "uesio/studio.allmetadata":
		botFunction = runAllMetadataLoadBot
	case "tcm/timetracker.project":
		botFunction = clickup.ProjectLoadBot
	case "tcm/timetracker.task":
		botFunction = clickup.TaskLoadBot
	}

	if botFunction == nil {
		return datasource.NewSystemBotNotFoundError()
	}

	return botFunction(op, connection, session)

}

// Unused by System Dialects, there is no actual file to load since they're all defined in Go code
func (b *SystemDialect) GetFilePath() string {
	return ""
}

// UNUSED for System Dialect
func (b *SystemDialect) GetDefaultFileBody(botType string) string {
	return ""
}
