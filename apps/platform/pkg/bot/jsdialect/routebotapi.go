package jsdialect

import (
	"encoding/json"
	"fmt"
	"net/http"

	"maps"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/bots"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type SimpleKeyStore[V any] interface {
	Get(key string) V
	Has(key string) bool
}

type HeadersKeyStore struct {
	store http.Header
}

func (s *HeadersKeyStore) Get(key string) string {
	return s.store.Get(key)
}

func (s *HeadersKeyStore) Has(key string) bool {
	_, ok := s.store[key]
	return ok
}

func NewRouteBotApi(bot *meta.Bot, route *meta.Route, request *http.Request, session *sess.Session, connection wire.Connection) *RouteBotAPI {
	paramsApi := NewRouteBotParamsAPI(route.Params)
	return &RouteBotAPI{
		session:       session,
		connection:    connection,
		bot:           bot,
		originalRoute: route,
		Params:        paramsApi,
		Request: &RouteBotRequestAPI{
			Path:   route.Path,
			Method: request.Method,
			Params: paramsApi,
			Headers: &HeadersKeyStore{
				store: request.Header,
			},
		},
		Response: &RouteBotResponseAPI{
			response: bots.NewRouteResponse(),
		},
		AsAdmin: &AsAdminApi{
			session:    session,
			connection: connection,
		},
		LogApi: NewBotLogAPI(bot, session.Context()),
		Http:   NewBotHttpAPI(wire.NewIntegrationConnection(nil, nil, session, nil, connection)),
	}
}

// RouteBotParamsAPI differs from BotParamsAPI in that params (the internal map)
// is NOT accessible to the Bot JS code, access is only through the Get and GetAll methods
type RouteBotParamsAPI struct {
	params map[string]any
}

func NewRouteBotParamsAPI(params map[string]any) *RouteBotParamsAPI {
	return &RouteBotParamsAPI{params: params}
}

func (p *RouteBotParamsAPI) MarshalJSON() ([]byte, error) {
	return json.Marshal(p.params)
}

func (p *RouteBotParamsAPI) Get(paramName string) any {
	return p.params[paramName]
}

func (p *RouteBotParamsAPI) GetAll() map[string]any {
	// Return a copy of the map so that the bot can't modify the original
	paramsCopy := make(map[string]any)
	maps.Copy(paramsCopy, p.params)
	return paramsCopy
}

type RouteBotAPI struct {
	session       *sess.Session
	originalRoute *meta.Route
	connection    wire.Connection
	bot           *meta.Bot
	Params        *RouteBotParamsAPI   `bot:"params"`
	Request       *RouteBotRequestAPI  `bot:"request"`
	Response      *RouteBotResponseAPI `bot:"response"`
	AsAdmin       *AsAdminApi          `bot:"asAdmin"`
	LogApi        *BotLogAPI           `bot:"log"`
	Http          *BotHttpAPI          `bot:"http"`
}

type RouteBotRequestAPI struct {
	Path    string                 `bot:"path"`
	Method  string                 `bot:"method"`
	Params  *RouteBotParamsAPI     `bot:"params"`
	Headers SimpleKeyStore[string] `bot:"headers"`
	Body    any                    `bot:"body"`
}

type RouteBotResponseAPI struct {
	response *bots.RouteResponse
}

func HandleBotResponse(api *RouteBotAPI) (finalRoute *meta.Route, err error) {
	// Check to see if any of the "set" or "redirect" methods have been called
	finalRoute = api.originalRoute
	rawResponse := api.Response.response
	// If the user has requested to redirect to a different route, load that route now
	if rawResponse.RedirectRoute != "" {
		localizedRouteKey := meta.GetLocalizedKey(rawResponse.RedirectRoute, api.bot.GetNamespace())
		route, err := meta.NewRoute(localizedRouteKey)
		if err != nil {
			return nil, err
		}
		if err = bundle.Load(route, nil, api.session, api.connection); err != nil {
			return nil, fmt.Errorf("unable to load redirect route for key '%s': %w", localizedRouteKey, err)
		}
		finalRoute = route
	}
	finalRoute.SetResponse(api.Response.response)
	return finalRoute, err
}

func (r *RouteBotResponseAPI) SetStatusCode(statusCode int) {
	if statusCode >= 200 && statusCode < 600 {
		r.response.StatusCode = statusCode
	}
}

func (r *RouteBotResponseAPI) SetBody(body any, contentType string) {
	r.response.Body = body
	if contentType != "" {
		r.response.Headers.Set("Content-Type", contentType)
	}
}

func (r *RouteBotResponseAPI) SetHeader(headerName, headerValue string) {
	r.response.Headers.Add(headerName, headerValue)
}

func (r *RouteBotResponseAPI) SetHeaders(headers map[string]string) {
	for headerName, headerValue := range headers {
		r.response.Headers.Add(headerName, headerValue)
	}
}

func (r *RouteBotResponseAPI) RedirectToURL(url string) {
	r.response.RedirectURL = url
}

// TODO: Implement this someday :)
//func (r *RouteBotResponseAPI) RedirectToRoute(routeKey string, params map[string]interface{}) {
//	r.response.RedirectRoute = routeKey
//	r.response.Params = params
//}

func (rba *RouteBotAPI) Save(collection string, changes wire.Collection, options *wire.SaveOptions) (*wire.Collection, error) {
	return botSave(collection, changes, options, rba.session, rba.connection, nil)
}

func (rba *RouteBotAPI) Delete(collection string, deletes wire.Collection) error {
	return botDelete(collection, deletes, rba.session, rba.connection, nil)
}

func (rba *RouteBotAPI) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(request, rba.session, rba.connection, nil)
}

func (rba *RouteBotAPI) RunIntegrationAction(integrationID string, action string, options any) (any, error) {
	return runIntegrationAction(integrationID, action, options, rba.session, rba.connection)
}

func (rba *RouteBotAPI) CallBot(botKey string, params map[string]any) (any, error) {
	return botCall(botKey, params, rba.session, rba.connection)
}

func (rba *RouteBotAPI) GetHostUrl() (string, error) {
	return getHostUrl(rba.session, rba.connection)
}

func (rba *RouteBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValue(configValueKey, rba.session)
}

func (rba *RouteBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(rba.session)
}

func (rba *RouteBotAPI) GetUser() *UserAPI {
	return NewUserAPI(rba.session.GetContextUser())
}

func (rba *RouteBotAPI) GetNamespace() string {
	return rba.bot.GetNamespace()
}

func (rba *RouteBotAPI) GetName() string {
	return rba.bot.Name
}

// GetAppName returns the key of the context application,
// which will either be the workspace's app, or the site's app
func (rba *RouteBotAPI) GetAppName() string {
	return rba.session.GetContextAppName()
}

// GetWorkspaceName returns the name of the current workspace, if there is one.
func (rba *RouteBotAPI) GetWorkspaceName() string {
	ws := rba.session.GetWorkspace()
	if ws == nil {
		return ""
	}
	return ws.Name
}
