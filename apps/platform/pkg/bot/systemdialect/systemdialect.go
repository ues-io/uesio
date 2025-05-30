package systemdialect

import (
	"fmt"
	"net/http"
	"slices"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/integ/bedrock"
	"github.com/thecloudmasters/uesio/pkg/integ/openai"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type BotFunc func(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error

type CallBotFunc func(params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error)

type LoadBotFunc func(request *wire.LoadOp, connection wire.Connection, session *sess.Session) error

type SaveBotFunc func(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error

type RouteBotFunc func(*meta.Route, *http.Request, wire.Connection, *sess.Session) (*meta.Route, error)

type RunIntegrationActionBotFunc func(bot *meta.Bot, integration *wire.IntegrationConnection, actionName string, params map[string]any) (any, error)

type SystemDialect struct {
}

func (b *SystemDialect) BeforeSave(bot *meta.Bot, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	var botFunction BotFunc

	switch request.CollectionName {
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

func (b *SystemDialect) AfterSave(bot *meta.Bot, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	var botFunction BotFunc

	switch request.CollectionName {
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

func (b *SystemDialect) CallBot(bot *meta.Bot, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {
	var botFunction CallBotFunc

	botNamespace := bot.GetNamespace()
	namespaces := session.GetContextNamespaces()

	if !slices.Contains(namespaces, botNamespace) {
		return nil, exceptions.NewForbiddenException(fmt.Sprintf(datasource.BotAccessErrorMessage, bot.GetKey()))
	}

	switch bot.GetKey() {
	case "listener:uesio/aikit.runagent":
		botFunction = runAgentListenerBot
	case "listener:uesio/studio.createbundle":
		botFunction = runCreateBundleListenerBot
	case "listener:uesio/studio.createsite":
		botFunction = runCreateSiteListenerBot
	case "listener:uesio/studio.workspacetruncate":
		botFunction = runWorkspaceTruncateListenerBot
	case "listener:uesio/studio.resetrecordaccesstokens":
		botFunction = runResetRecordAccessTokensListenerBot
	case "listener:uesio/studio.setworkspaceuser":
		botFunction = runSetWorkspaceUserBot
	case "listener:uesio/core.createapikey":
		botFunction = runCreateApiKeyListenerBot
	case "listener:uesio/studio.checkavailability":
		botFunction = runCheckAvailabilityBot
	case "listener:uesio/studio.addexternalbundle":
		botFunction = runAddExternalBundleListenerBot
	case "listener:uesio/studio.getstarterparams":
		botFunction = runGetStarterParamsBot
	}

	if botFunction == nil {
		return nil, exceptions.NewSystemBotNotFoundException()
	}

	return botFunction(params, connection, session)

}

func (b *SystemDialect) RunIntegrationActionBot(bot *meta.Bot, ic *wire.IntegrationConnection, actionName string, params map[string]any) (any, error) {

	var botFunction RunIntegrationActionBotFunc

	// Intercept system integration types
	switch ic.GetIntegrationType().GetKey() {
	case "uesio/aikit.bedrock":
		botFunction = bedrock.RunAction
	case "uesio/core.openai":
		botFunction = openai.RunAction
	}

	if botFunction == nil {
		return nil, exceptions.NewSystemBotNotFoundException()
	}

	return botFunction(bot, ic, actionName, params)

}

func (b *SystemDialect) CallGeneratorBot(bot *meta.Bot, create bundlestore.FileCreator, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {
	return nil, nil
}

func (b *SystemDialect) RouteBot(bot *meta.Bot, route *meta.Route, request *http.Request, connection wire.Connection, session *sess.Session) (*meta.Route, error) {
	var botFunction RouteBotFunc

	routeKey := route.GetKey()

	switch routeKey {
	case "uesio/core.login":
		botFunction = runLoginRouteBot
	case "uesio/core.signup":
		botFunction = runSignupRouteBot
	}

	if botFunction == nil {
		return nil, exceptions.NewSystemBotNotFoundException()
	}

	return botFunction(route, request, connection, session)

}

func getLoadBotFunc(botKey, collectionName string) LoadBotFunc {
	switch botKey {
	case "load:uesio/core.uesio_load":
		return runUesioExternalLoadBot
	}

	switch collectionName {
	case "uesio/appkit.mock_user":
		return runMockUserBot
	case "uesio/core.usage":
		return runUsageLoadBot
	case "uesio/core.userfile":
		return runUserfileLoadBot
	case "uesio/core.featureflag":
		return runFeatureFlagLoadBot
	case "uesio/core.configvalue":
		return runConfigValueLoadBot
	case "uesio/core.secret":
		return runSecretLoadBot
	case "uesio/core.myintegrationcredentials":
		return runMyIntegrationCredentialsLoadBot
	case "uesio/studio.recentmetadata":
		return runRecentMetadataLoadBot
	case "uesio/studio.usertokenvalue":
		return runUserTokenValueLoadBot
	case "uesio/studio.recordtokenvalue":
		return runRecordTokenValueLoadBot
	}

	if meta.IsBundleableCollection(collectionName) {
		return runStudioMetadataLoadBot
	} else if meta.IsCoreBundleableCollection(collectionName) {
		return runCoreMetadataLoadBot
	}
	return nil
}

func (b *SystemDialect) LoadBot(bot *meta.Bot, op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {
	botFunction := getLoadBotFunc(bot.GetKey(), op.CollectionName)
	if botFunction == nil {
		return exceptions.NewSystemBotNotFoundException()
	}
	return botFunction(op, connection, session)
}

func getSaveBotFunc(botKey, collectionName string) SaveBotFunc {
	switch botKey {
	case "save:uesio/core.uesio_save":
		return runUesioExternalSaveBot
	}

	switch collectionName {
	case "uesio/core.userfile":
		return runUserfileSaveBot
	case "uesio/core.featureflag":
		return runFeatureFlagSaveBot
	case "uesio/core.configvalue":
		return runConfigValueSaveBot
	case "uesio/core.secret":
		return runSecretSaveBot
	}

	if meta.IsBundleableCollection(collectionName) {
		return runStudioMetadataSaveBot
	}
	return nil
}

func (b *SystemDialect) SaveBot(bot *meta.Bot, op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	botFunction := getSaveBotFunc(bot.GetKey(), op.CollectionName)
	if botFunction == nil {
		return exceptions.NewSystemBotNotFoundException()
	}
	return botFunction(op, connection, session)
}
