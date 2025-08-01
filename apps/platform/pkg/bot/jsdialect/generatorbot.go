package jsdialect

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"math/big"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/sethvargo/go-password/password"
	"golang.org/x/sync/errgroup"
	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/auth/platform"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var passwordGenerator *password.Generator

func init() {
	var err error
	passwordGenerator, err = password.NewGenerator(&password.GeneratorInput{
		Symbols: platform.PasswordPolicySimplifiedSymbols,
	})
	if err != nil {
		panic(fmt.Sprintf("failed to create password generator: %v", err))
	}
}

func NewGeneratorBotAPI(ctx context.Context, bot *meta.Bot, params map[string]any, create bundlestore.FileCreator, session *sess.Session, connection wire.Connection) *GeneratorBotAPI {
	return &GeneratorBotAPI{
		Params: &ParamsAPI{
			Params: params,
		},
		LogApi:     NewBotLogAPI(ctx, bot),
		session:    session,
		create:     create,
		bot:        bot,
		connection: connection,
		Results:    map[string]any{},
		ctx:        ctx,
	}
}

type IntegrationActionOptions struct {
	IntegrationID string `bot:"integration"`
	Action        string `bot:"action"`
	Options       any    `bot:"options"`
}

type GeneratorBotOptions struct {
	Namespace string         `bot:"namespace"`
	Name      string         `bot:"name"`
	Params    map[string]any `bot:"params"`
}

type GeneratorBotAPI struct {
	Params     *ParamsAPI `bot:"params"`
	LogApi     *BotLogAPI `bot:"log"`
	bot        *meta.Bot
	create     bundlestore.FileCreator
	session    *sess.Session
	connection wire.Connection
	Results    map[string]any
	// Intentionally maintaining a context here because this code is called from javascript so we have to keep track of the context
	// upon creation so we can use as the bot processes. This is an exception to the rule of avoiding keeping context in structs.
	ctx context.Context
}

func (gba *GeneratorBotAPI) AddResult(key string, value any) {
	gba.Results[key] = value
}

func (gba *GeneratorBotAPI) SetRedirect(redirect string) {
	gba.Results["uesio.redirect"] = redirect
}

// GetAppName returns the key of the current workspace's app
func (gba *GeneratorBotAPI) GetAppName() string {
	ws := gba.session.GetWorkspace()
	if ws != nil {
		return ws.GetAppFullName()
	}
	return ""
}

func (gba *GeneratorBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(gba.ctx, gba.session)
}

func (gba *GeneratorBotAPI) GetUser() *UserAPI {
	return NewUserAPI(gba.session.GetContextUser())
}

// GetAppName returns the name of the current workspace's app
func (gba *GeneratorBotAPI) GetApp() *AppAPI {
	return gba.GetSession().GetApp(gba.connection)
}

// GetWorkspaceName returns the name of the current workspace
func (gba *GeneratorBotAPI) GetWorkspaceName() string {
	ws := gba.session.GetWorkspace()
	if ws != nil {
		return ws.Name
	}
	return ""
}

// GetName returns the name of the bot
func (gba *GeneratorBotAPI) GetName() string {
	return gba.bot.Name
}

// GetNamespace returns the namespace of the bot
func (gba *GeneratorBotAPI) GetNamespace() string {
	return gba.bot.GetNamespace()
}

func (gba *GeneratorBotAPI) Sleep(ms int64) {
	time.Sleep(time.Duration(ms) * time.Millisecond)
}

func (gba *GeneratorBotAPI) CreateBundle(options *deploy.CreateBundleOptions) (map[string]any, error) {
	if options == nil {
		return nil, errors.New("you must provide options to the create bundle api")
	}
	ws := gba.session.GetWorkspace()
	if ws == nil {
		return nil, errors.New("you must be in a workspace context to create a bundle in a generator")
	}

	if options.AppName == "" {
		options.AppName = gba.GetAppName()
	}

	if options.WorkspaceName == "" {
		options.WorkspaceName = gba.GetWorkspaceName()
	}

	bundle, err := deploy.CreateBundle(gba.ctx, options, gba.connection, gba.session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"major":       bundle.Major,
		"minor":       bundle.Minor,
		"patch":       bundle.Patch,
		"description": bundle.Description,
	}, nil

}

func (gba *GeneratorBotAPI) CreateSite(options *deploy.CreateSiteOptions) (map[string]any, error) {

	if options == nil {
		return nil, errors.New("you must provide options to the create site api")
	}

	if options.AppName == "" {
		options.AppName = gba.GetAppName()
	}

	site, err := deploy.CreateSite(gba.ctx, options, gba.connection, gba.session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"id": site.ID,
	}, nil

}

func (gba *GeneratorBotAPI) CreateUser(options *deploy.CreateUserOptions) (map[string]any, error) {

	if options == nil {
		return nil, errors.New("you must provide options to the create user api")
	}
	_, err := deploy.CreateUser(gba.ctx, options, gba.connection, gba.session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}
	return map[string]any{}, nil

}

func (gba *GeneratorBotAPI) GeneratePassword() (string, error) {
	// generate password with two digits, two symbols and 9 letters
	generated, err := passwordGenerator.Generate(13, 2, 2, false, false)
	if err != nil {
		return "", err
	}
	// make sure we have at least one lower and one upper to satisfy our password policy
	lower, err := randomElement(rand.Reader, password.LowerLetters)
	if err != nil {
		return "", err
	}
	upper, err := randomElement(rand.Reader, password.UpperLetters)
	if err != nil {
		return "", err
	}
	generated, err = randomInsert(rand.Reader, generated, lower)
	if err != nil {
		return "", err
	}
	generated, err = randomInsert(rand.Reader, generated, upper)
	if err != nil {
		return "", err
	}

	// 15 char password with 2 digits, 2 symbols and 11 letters with at least 1 lower and 1 upper
	return generated, nil
}

func (gba *GeneratorBotAPI) CallBot(botKey string, params map[string]any) (any, error) {
	return botCall(gba.ctx, botKey, params, gba.session, gba.connection)
}

func (gba *GeneratorBotAPI) RunGenerator(namespace, name string, params map[string]any) error {
	_, err := datasource.CallGeneratorBot(gba.ctx, gba.create, namespace, name, params, gba.connection, gba.session)
	return err
}

func (gba *GeneratorBotAPI) RunGenerators(generators []GeneratorBotOptions) error {
	eg := new(errgroup.Group)
	creates := map[string]*bytes.Buffer{}
	mu := sync.Mutex{}
	for _, generator := range generators {
		eg.Go(func() error {
			_, err := datasource.CallGeneratorBot(gba.ctx, func(s string) (io.WriteCloser, error) {
				buf := &bytes.Buffer{}
				mu.Lock()
				creates[s] = buf
				mu.Unlock()
				return retrieve.NopWriterCloser(buf), nil
			}, generator.Namespace, generator.Name, generator.Params, gba.connection, gba.session)
			return err
		})
	}
	err := eg.Wait()
	if err != nil {
		return err
	}

	for fileName, buf := range creates {
		w, err := gba.create(fileName)
		if err != nil {
			return err
		}
		_, err = io.Copy(w, buf)
		if err != nil {
			return err
		}
	}

	return nil
}

func (gba *GeneratorBotAPI) RunIntegrationActions(actions []IntegrationActionOptions) ([]any, error) {
	eg := new(errgroup.Group)
	results := []any{}
	for _, action := range actions {
		eg.Go(func() error {
			result, err := runIntegrationAction(gba.ctx, action.IntegrationID, action.Action, action.Options, gba.session.RemoveWorkspaceContext(), gba.connection)
			if err != nil {
				return err
			}
			results = append(results, result)
			return nil
		})
	}
	err := eg.Wait()
	if err != nil {
		return nil, err
	}
	return results, nil
}

func (gba *GeneratorBotAPI) RunIntegrationAction(integrationID string, action string, options any) (any, error) {
	return runIntegrationAction(gba.ctx, integrationID, action, options, gba.session.RemoveWorkspaceContext(), gba.connection)
}

func (gba *GeneratorBotAPI) GetTemplate(templateFile string) (string, error) {
	// Load in the template text from the Bot.
	r, _, err := bundle.GetItemAttachment(gba.ctx, gba.bot, templateFile, gba.session, gba.connection)
	if err != nil {
		return "", err
	}
	defer r.Close()

	b, err := io.ReadAll(r)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func (gba *GeneratorBotAPI) MergeYamlString(params map[string]any, templateString string) (string, error) {
	data, err := performYamlMerge(templateString, params)
	if err != nil {
		return "", err
	}
	return data.String(), nil
}

func (gba *GeneratorBotAPI) MergeYamlTemplate(params map[string]any, templateFile string) (string, error) {
	templateString, err := gba.GetTemplate(templateFile)
	if err != nil {
		return "", err
	}
	return gba.MergeYamlString(params, templateString)
}

func (gba *GeneratorBotAPI) GenerateFile(filename string, params map[string]any, templateFile string) error {
	templateString, err := gba.GetTemplate(templateFile)
	if err != nil {
		return err
	}
	// Don't do the merge if we don't have params
	if len(params) == 0 {
		return gba.AddFile(filename, strings.NewReader(templateString))
	}
	f, err := gba.create(filename)
	if err != nil {
		return err
	}
	return mergeTemplate(f, params, templateString)
}

func (gba *GeneratorBotAPI) AddFile(filename string, r io.Reader) error {
	f, err := gba.create(filename)
	if err != nil {
		return err
	}
	_, err = io.Copy(f, r)
	if err != nil {
		return err
	}
	return nil
}

func (gba *GeneratorBotAPI) GenerateYamlFile(filename string, params map[string]any, templateFile string) error {
	merged, err := gba.MergeYamlTemplate(params, templateFile)
	if err != nil {
		return err
	}
	return gba.GenerateStringFile(filename, merged)
}

func (gba *GeneratorBotAPI) GenerateStringFile(filename string, content string) error {
	return gba.AddFile(filename, strings.NewReader(content))
}

func (gba *GeneratorBotAPI) GenerateBase64File(filename string, content string) error {
	decoded, err := base64.StdEncoding.DecodeString(content)
	if err != nil {
		return err
	}
	return gba.AddFile(filename, bytes.NewReader(decoded))
}

func (gba *GeneratorBotAPI) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(gba.ctx, request, gba.session, gba.connection, nil)
}

func (gba *GeneratorBotAPI) Save(collection string, changes wire.Collection, options *wire.SaveOptions, session *sess.Session, connection wire.Connection) (*wire.Collection, error) {
	return botSave(gba.ctx, collection, changes, options, gba.session, gba.connection, nil)
}

func performYamlMerge(templateString string, params map[string]any) (*bytes.Buffer, error) {
	node, err := mergeYamlString(templateString, params)
	if err != nil {
		return nil, err
	}

	data := &bytes.Buffer{}
	encoder := yaml.NewEncoder(data)
	encoder.SetIndent(2)
	err = encoder.Encode(node)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func mergeYamlString(templateString string, params map[string]any) (*yaml.Node, error) {
	node := &yaml.Node{}
	// First parse the yaml file
	err := yaml.Unmarshal([]byte(templateString), node)
	if err != nil {
		return nil, err
	}

	err = mergeNode(node, params)
	if err != nil {
		return nil, err
	}

	return node, nil

}

var MERGE_REGEX = regexp.MustCompile(`\$\{(.*?)\}`)

func mergeNode(node *yaml.Node, params map[string]any) error {
	if node == nil || params == nil {
		return nil
	}

	if node.Kind == yaml.DocumentNode {
		return mergeNode(node.Content[0], params)
	}

	if node.Kind == yaml.SequenceNode || node.Kind == yaml.MappingNode {
		for i := range node.Content {
			err := mergeNode(node.Content[i], params)
			if err != nil {
				return err
			}
		}
	}

	if node.Kind == yaml.ScalarNode {

		matches := MERGE_REGEX.FindAllStringSubmatch(node.Value, -1)
		for _, match := range matches {
			if len(match) == 2 {
				matchExpression := match[0] //${mymerge}
				merge := match[1]           // mymerge
				mergeValue, hasValue := params[merge]
				if !hasValue {
					continue
				}
				mergeString, ok := mergeValue.(string)
				if ok {

					newNode, err := mergeYamlString(mergeString, nil)
					if err != nil {
						return err
					}

					if len(newNode.Content) == 0 {
						node.SetString("")
						continue
					}

					contentNode := newNode.Content[0]

					// If newNode is a scalar we can just merge it in to the template
					if contentNode.Kind == yaml.ScalarNode {
						node.SetString(strings.Replace(node.Value, matchExpression, contentNode.Value, 1))
						continue
					}

					// If newNode is not a scalar, then we have to be sure it was the
					// entire merge.
					if matchExpression != node.Value {
						return fmt.Errorf("cannot merge a sequence or map into a multipart template: %s : %s", matchExpression, node.Value)
					}

					// Replace that crap
					*node = *contentNode
				} else {
					newNode := &yaml.Node{}
					err := newNode.Encode(mergeValue)
					if err != nil {
						return err
					}
					*node = *newNode
				}
			}
		}

	}

	return nil

}

func randomInsert(reader io.Reader, s, val string) (string, error) {
	if s == "" {
		return val, nil
	}

	n, err := rand.Int(reader, big.NewInt(int64(len(s)+1)))
	if err != nil {
		return "", fmt.Errorf("failed to generate random integer: %w", err)
	}
	i := n.Int64()
	return s[0:i] + val + s[i:], nil
}

func randomElement(reader io.Reader, s string) (string, error) {
	n, err := rand.Int(reader, big.NewInt(int64(len(s))))
	if err != nil {
		return "", fmt.Errorf("failed to generate random integer: %w", err)
	}
	return string(s[n.Int64()]), nil
}
