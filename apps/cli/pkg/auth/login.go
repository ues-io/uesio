package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"slices"
	"strings"

	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"

	"github.com/AlecAivazis/survey/v2"
	"github.com/cli/browser"
	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/config/host"
	"github.com/thecloudmasters/cli/pkg/wire"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/preload"
	authtype "github.com/thecloudmasters/uesio/pkg/types/auth"
	"golang.org/x/sync/errgroup"
)

// NOTE: We continue to support platform & mock login in order to support tests and simplify local development.
// TODO: Eliminate platform & mock login methods adjust support environment variables once OAuth is fully implemented
// and tokens supported.
const platformLoginMethod = "uesio/core.platform"
const mockLoginMethod = "uesio/core.mock"
const browserLoginMethod = "browser"

var errPublicUser = errors.New("you must be logged in to use the CLI, please logout and login or contact your system administrator")

type LoginHandler func() (*authtype.TokenResponse, error)

type LoginMethodHandler struct {
	Key   string
	Login LoginHandler
}

func parseKey(key string) (string, string, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return "", "", fmt.Errorf("invalid key: %s", key)
	}
	return keyArray[0], keyArray[1], nil
}

func getMockHandler() (*LoginMethodHandler, error) {
	// Check to see if any mock logins exist.
	users, err := wire.GetMockUsers()
	if err != nil {
		// For backwards compatibility just ignore the error here
		// and continue witout allowing mock login
		return nil, nil
	}

	if users.Len() == 0 {
		return nil, nil
	}

	mockUserNames := []string{}

	for _, user := range users {
		username, err := user.GetFieldAsString("uesio/appkit.username")
		if err != nil {
			return nil, err
		}
		mockUserNames = append(mockUserNames, username)
	}

	return &LoginMethodHandler{
		Key: mockLoginMethod,
		Login: func() (*authtype.TokenResponse, error) {
			username := os.Getenv("UESIO_CLI_USERNAME")
			if username == "" {
				err := survey.AskOne(&survey.Select{
					Message: "Select a user.",
					Options: mockUserNames,
				}, &username)
				if err != nil {
					return nil, err
				}
			}
			payload := map[string]string{
				"token": username,
			}
			return processDirectLogin(mockLoginMethod, payload)
		},
	}, nil

}

var platformHandler = &LoginMethodHandler{
	Key: platformLoginMethod,
	Login: func() (*authtype.TokenResponse, error) {
		username := os.Getenv("UESIO_CLI_USERNAME")
		password := os.Getenv("UESIO_CLI_PASSWORD")

		if username == "" {
			usernameErr := survey.AskOne(&survey.Input{
				Message: "Username",
			}, &username)
			if usernameErr != nil {
				return nil, usernameErr
			}
		}
		if password == "" {
			pwErr := survey.AskOne(&survey.Password{
				Message: "Password",
			}, &password)
			if pwErr != nil {
				return nil, pwErr
			}
		}
		payload := map[string]string{
			"username": username,
			"password": password,
		}

		return processDirectLogin(platformLoginMethod, payload)

	},
}

var browserHandler = &LoginMethodHandler{
	Key: browserLoginMethod,
	Login: func() (*authtype.TokenResponse, error) {
		platformBaseURL, err := host.GetHostPrompt()
		if err != nil {
			return nil, err
		}
		authURL, err := url.JoinPath(platformBaseURL, "/site/auth/cli/authorize")
		if err != nil {
			return nil, err
		}

		codeVerifier, err := generateCodeVerifier()
		if err != nil {
			return nil, fmt.Errorf("failed to generate code verifier: %w", err)
		}
		codeChallenge := generateCodeChallenge(codeVerifier)

		state, err := generateState()
		if err != nil {
			return nil, fmt.Errorf("failed to generate state: %w", err)
		}

		ready := make(chan string, 1)
		defer close(ready)

		// if an error occurs server side, the callback will not return so we cancel
		// if we haven't finished
		ctx, cancel := context.WithTimeout(context.Background(), auth.AuthCodeLifetime)
		defer cancel()

		eg, ctx := errgroup.WithContext(ctx)
		var tokenResp *authtype.TokenResponse
		eg.Go(func() error {
			select {
			case openURL := <-ready:
				fmt.Printf("Opening browser for authentication...\n")
				fmt.Printf("If browser doesn't open, visit: %s\n", openURL)

				if err := browser.OpenURL(openURL); err != nil {
					fmt.Printf("Could not open browser: %v\n", err)
				}

				return nil
			case <-ctx.Done():
				return fmt.Errorf("context done while waiting for authorization: %w", ctx.Err())
			}
		})
		eg.Go(func() error {
			code, redirectURL, err := receiveCodeViaLocalServer(ctx, &localServerConfig{readyChan: ready, state: state, codeChallenge: codeChallenge, codeChallengeMethod: "S256", siteURL: platformBaseURL, authURL: authURL})
			if err != nil {
				return fmt.Errorf("authorization error: %w", err)
			}

			tokenResp, err = exchangePKCECode(code, codeVerifier, redirectURL)
			if err != nil {
				return fmt.Errorf("failed to exchange code for token: %w", err)
			}
			return nil
		})
		if err := eg.Wait(); err != nil {
			return nil, fmt.Errorf("error during authentication: %w", err)
		}
		if tokenResp == nil {
			return nil, errors.New("no authorization response")
		}
		return tokenResp, nil
	},
}

func exchangePKCECode(authCode string, codeVerifier string, redirectURL string) (*authtype.TokenResponse, error) {
	v := url.Values{
		"code":          {authCode},
		"code_verifier": {codeVerifier},
		"redirect_uri":  {redirectURL},
	}

	// application/x-www-form-urlencoded per https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3
	resp, err := call.PostForm("site/auth/cli/token", strings.NewReader(v.Encode()), "", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("exchange failed with status %d", resp.StatusCode)
	}

	var tokenResp authtype.TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, err
	}

	return &tokenResp, nil
}

func processDirectLogin(method string, payload map[string]string) (*authtype.TokenResponse, error) {
	methodNamespace, methodName, err := parseKey(method)
	if err != nil {
		return nil, err
	}

	payloadBytes := &bytes.Buffer{}

	err = json.NewEncoder(payloadBytes).Encode(&payload)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("site/auth/cli/%s/%s/login", methodNamespace, methodName)

	resp, err := call.Post(url, payloadBytes, "", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var tokenResponse authtype.TokenResponse

	err = json.NewDecoder(resp.Body).Decode(&tokenResponse)
	if err != nil {
		return nil, err
	}

	return &tokenResponse, nil
}

func getLoginHandler() (*LoginMethodHandler, error) {
	loginMethod := os.Getenv("UESIO_CLI_LOGIN_METHOD")
	if loginMethod == "" || loginMethod == browserLoginMethod {
		return browserHandler, nil
	}

	if loginMethod == platformLoginMethod {
		return platformHandler, nil
	}

	if loginMethod == mockLoginMethod {
		if mockHandler, err := getMockHandler(); err != nil {
			return nil, err
		} else if mockHandler != nil {
			return mockHandler, nil
		}
	}

	return nil, fmt.Errorf("invalid login method: %s", loginMethod)
}

func validatePermissions(user *preload.UserMergeData) error {
	// We need to do some santiy checks here for a couple of different reasons:
	//   1. PublicUser means the user is not logged in
	//   2. If we have a non-public user but the user doesn't have WorkspaceAdminPerm, all downstream API requests will fail but they
	//      will fail in different ways (e.g., HTTP status code, messages embedded in wire errors, Location header redirects, etc.). To avoid
	//      displaying confusing error messages to the user, we check that they have permission to access workspaces and if not, fail fast.
	// TODO: Remove aLl of these checks once we refactor/improve error handling throughout the system and have a reliable and consistent approach to auth, errors, etc.
	if user == nil || user.Username == meta.PublicUsername {
		return errPublicUser
	} else if !slices.Contains(user.NamedPerms, constant.WorkspaceAdminPerm) {
		return fmt.Errorf("user %s does not have permission to use the CLI, please logout and login with a different user or contact your system administrator", user.Username)
	} else {
		return nil
	}
}

func Login() (*preload.UserMergeData, error) {
	return LoginWithOptions(false)
}

func LoginWithOptions(force bool) (*preload.UserMergeData, error) {
	if !force {
		if currentUser, err := Check(); err != nil {
			return nil, err
		} else if currentUser != nil {
			if err := validatePermissions(currentUser); err == nil {
				return currentUser, nil
			} else if !errors.Is(err, errPublicUser) {
				return nil, err
			}
		}
	}

	// store off current token so we can log it out after successful login
	origToken, origTokenErr := config.GetToken()
	if origTokenErr != nil {
		return nil, origTokenErr
	}

	handler, err := getLoginHandler()
	if err != nil {
		return nil, err
	}

	result, err := handler.Login()
	if err != nil {
		return nil, err
	}
	if err := validatePermissions(result.User); err != nil {
		return nil, err
	}

	err = config.SetToken(result.Token)
	if err != nil {
		return nil, err
	}

	if origToken != "" {
		// intentionally ignoring any failure - the session will eventually expire
		_ = logoutToken(origToken)
	}

	return result.User, nil
}

func generateCodeVerifier() (string, error) {
	// per https://datatracker.ietf.org/doc/html/rfc7636#section-4.1
	return generateRandom(32)
}

func generateState() (string, error) {
	return generateRandom(32)
}

func generateCodeChallenge(verifier string) string {
	sha := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sha[:])
}

func generateRandom(size int) (string, error) {
	bytes := make([]byte, size)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes)[:size], nil
}
