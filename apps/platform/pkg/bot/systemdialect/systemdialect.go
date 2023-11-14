package systemdialect

import (
	"fmt"
	"slices"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/clickup"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/integ/bedrock"
	"github.com/thecloudmasters/uesio/pkg/integ/openai"
	"github.com/thecloudmasters/uesio/pkg/integ/sendgrid"
	"github.com/thecloudmasters/uesio/pkg/integ/stripe"
	"github.com/thecloudmasters/uesio/pkg/integ/web"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type BotFunc func(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error

type CallBotFunc func(params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error)

type LoadBotFunc func(request *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error

type SaveBotFunc func(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error

type RouteBotFunc func(*meta.Route, *sess.Session) (*meta.Route, error)

type RunIntegrationActionBotFunc func(bot *meta.Bot, integration *adapt.IntegrationConnection, actionName string, params map[string]interface{}) (interface{}, error)

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
	case "uesio/studio.app":
		botFunction = runAppAfterSaveBot
	case "uesio/studio.integrationtype":
		botFunction = runIntegrationTypeAfterSaveBot
	}

	if botFunction == nil {
		return nil
	}

	return botFunction(request, connection, session)

}

func (b *SystemDialect) CallBot(bot *meta.Bot, params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {
	var botFunction CallBotFunc

	botNamespace := bot.GetNamespace()
	namespaces := session.GetContextNamespaces()

	if !slices.Contains(namespaces, botNamespace) {
		return nil, meta.NewBotAccessError(fmt.Sprintf(datasource.BotAccessErrorMessage, bot.GetKey()))
	}

	switch bot.GetKey() {
	case "listener:uesio/studio.createbundle":
		botFunction = runCreateBundleListenerBot
	case "listener:uesio/studio.makepayment":
		botFunction = runMakePaymentListenerBot
	case "listener:uesio/studio.workspacetruncate":
		botFunction = RunWorkspaceTruncateListenerBot
	case "listener:uesio/studio.resetrecordaccesstokens":
		botFunction = runResetRecordAccessTokensListenerBot
	case "listener:uesio/studio.setworkspaceuser":
		botFunction = runSetWorkspaceUserBot
	case "listener:uesio/studio.checkavailability":
		botFunction = runCheckAvailabilityBot
	}

	if botFunction == nil {
		return nil, datasource.NewSystemBotNotFoundError()
	}

	return botFunction(params, connection, session)

}

func (b *SystemDialect) RunIntegrationActionBot(bot *meta.Bot, ic *adapt.IntegrationConnection, actionName string, params map[string]interface{}) (interface{}, error) {

	var botFunction RunIntegrationActionBotFunc

	// Intercept system integration types
	switch ic.GetIntegrationType().GetKey() {
	case "uesio/core.bedrock":
		botFunction = bedrock.RunAction
	case "uesio/core.openai":
		botFunction = openai.RunAction
	case "uesio/core.stripe":
		botFunction = stripe.RunAction
	case "uesio/core.sendgrid":
		botFunction = sendgrid.RunAction
	case "uesio/core.web":
		botFunction = web.RunAction
	}

	if botFunction == nil {
		return nil, datasource.NewSystemBotNotFoundError()
	}

	return botFunction(bot, ic, actionName, params)

}

func (b *SystemDialect) CallGeneratorBot(bot *meta.Bot, create bundlestore.FileCreator, params map[string]interface{}, connection adapt.Connection, session *sess.Session) error {
	return nil
}

func (b *SystemDialect) RouteBot(bot *meta.Bot, route *meta.Route, session *sess.Session) (*meta.Route, error) {
	var botFunction RouteBotFunc

	routeKey := route.GetKey()

	switch routeKey {
	case "uesio/studio.paymentsuccess":
		botFunction = runPaymentSuccessRouteBot
	case "uesio/core.login":
		botFunction = runLoginRouteBot
	case "uesio/core.signup":
		botFunction = runSignupRouteBot
	}

	if botFunction == nil {
		return nil, datasource.NewSystemBotNotFoundError()
	}

	return botFunction(route, session)

}

func (b *SystemDialect) LoadBot(bot *meta.Bot, op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {
	var botFunction LoadBotFunc

	switch op.CollectionName {
	case "uesio/core.usage":
		botFunction = runUsageLoadBot
	case "uesio/core.myintegrationcredentials":
		botFunction = runMyIntegrationCredentialsLoadBot
	case "uesio/studio.recentmetadata":
		botFunction = runRecentMetadataLoadBot
	case "uesio/studio.blogentry":
		botFunction = runBlogEntryLoadBot
	case "uesio/studio.recentdoc":
		botFunction = runRecentDocLoadBot
	case "uesio/studio.usertokenvalue":
		botFunction = runUserTokenValueLoadBot
	case "uesio/studio.recordtokenvalue":
		botFunction = runRecordTokenValueLoadBot
	case "tcm/timetracker.project":
		botFunction = clickup.ProjectLoadBot
	case "tcm/timetracker.task":
		botFunction = clickup.TaskLoadBot
	}

	if meta.IsBundleableCollection(op.CollectionName) {
		botFunction = runStudioMetadataLoadBot
	} else if meta.IsCoreBundleableCollection(op.CollectionName) {
		botFunction = runCoreMetadataLoadBot
	}

	if botFunction == nil {
		return datasource.NewSystemBotNotFoundError()
	}

	return botFunction(op, connection, session)

}

func (b *SystemDialect) SaveBot(bot *meta.Bot, op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	var botFunction SaveBotFunc

	switch op.Metadata.GetFullName() {

	}

	if meta.IsBundleableCollection(op.Metadata.GetFullName()) {
		botFunction = runStudioMetadataSaveBot
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
