package auth

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"html/template"
	"net"
	"net/http"
	"net/url"
	"sync"
	"time"

	"golang.org/x/sync/errgroup"
)

type authorizationResponse struct {
	code string
	err  error
}

type localServerConfig struct {
	readyChan           chan<- string
	state               string
	codeChallenge       string
	codeChallengeMethod string
	authURL             string
	siteURL             string
}

type callbackHandlerConfig struct {
	state        string
	respCh       chan<- *authorizationResponse
	onceRespCh   sync.Once
	callbackPath string
	siteURL      string
}

const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Uesio CLI Authorization</title>
	<style>
		body {
			background-color: #eee;
			margin: 0;
			padding: 0;
			font-family: sans-serif;
		}
		.placeholder {
			margin: 2em;
			padding: 2em;
			background-color: #fff;
			border-radius: 1em;
		}
		.error {
			color: red;
		}
	</style>
</head>
<body>
	<div class="placeholder">		
		<h1 class="{{ if .Error }}error{{ end }}">Uesio CLI Authorization {{ if .Error }}Failed{{ else }}Successful{{ end }}</h1>
		<p>
			{{ if .Error }}
				Close this tab and return to the CLI for details.
			{{ else }}
				Close this tab and return to the CLI to complete the login process.
			{{ end }}
		</p>
		<p>
			{{ if .Error }}
				If you are having trouble logging in, visit <a href="{{ .SiteURL }}">{{ .SiteURL }}</a>, ensure that you are logged out and then login again from the CLI.
			{{ else }}
				To login to the CLI as a different user, visit <a href="{{ .SiteURL }}">{{ .SiteURL }}</a>, logout and then login again from the CLI.
			{{ end }}
		</p>
	</div>
</body>
</html>
`

func receiveCodeViaLocalServer(ctx context.Context, cfg *localServerConfig) (string, string, error) {
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return "", "", fmt.Errorf("could not start a local listener: %w", err)
	}
	defer func() {
		// The listener may be closed by the server. No need to check the error.
		_ = l.Close()
	}()

	addr, ok := l.Addr().(*net.TCPAddr)
	if !ok {
		return "", "", fmt.Errorf("internal error: got a unknown type of listener %T", l.Addr())
	}

	redirectURL := &url.URL{
		Scheme: "http",
		Host:   fmt.Sprintf("localhost:%d", addr.Port),
		Path:   "/cli_auth_callback",
	}

	authURL, err := url.Parse(cfg.authURL)
	if err != nil {
		return "", "", fmt.Errorf("failed to parse auth URL: %w", err)
	}
	qry := &url.Values{}
	qry.Set("code_challenge", cfg.codeChallenge)
	qry.Set("code_challenge_method", cfg.codeChallengeMethod)
	qry.Set("state", cfg.state)
	qry.Set("redirect_uri", redirectURL.String())
	authURL.RawQuery = qry.Encode()

	respCh := make(chan *authorizationResponse)
	shutdownCh := make(chan struct{})

	callbackHandlerConfig := &callbackHandlerConfig{
		state:        cfg.state,
		respCh:       respCh,
		callbackPath: redirectURL.Path,
		siteURL:      cfg.siteURL,
	}
	server, err := setupLocalServer(callbackHandlerConfig)
	if err != nil {
		return "", "", fmt.Errorf("could not setup local server: %w", err)
	}

	var resp *authorizationResponse
	var eg errgroup.Group
	eg.Go(func() error {
		defer close(respCh)

		if err := server.Serve(l); err != nil && err != http.ErrServerClosed {
			return fmt.Errorf("could not start local server: %w", err)
		}
		return nil
	})
	eg.Go(func() error {
		defer close(shutdownCh)

		select {
		case gotResp, ok := <-respCh:
			if ok {
				resp = gotResp
			}
			return nil
		case <-ctx.Done():
			return ctx.Err()
		}
	})
	eg.Go(func() error {
		<-shutdownCh
		// Gracefully shutdown the server in the timeout.
		// If the server has not started, Shutdown returns nil and this returns immediately.
		// If Shutdown has failed, force-close the server.
		ctx, cancel := context.WithTimeout(ctx, 5*time.Minute)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			_ = server.Close()
			return nil
		}
		return nil
	})
	eg.Go(func() error {
		select {
		case cfg.readyChan <- authURL.String():
			return nil
		case <-ctx.Done():
			return ctx.Err()
		}
	})
	if err := eg.Wait(); err != nil {
		return "", "", fmt.Errorf("authorization error: %w", err)
	}
	if resp == nil {
		return "", "", errors.New("no authorization response")
	}
	return resp.code, redirectURL.String(), resp.err
}

func setupLocalServer(cfg *callbackHandlerConfig) (*http.Server, error) {
	t, err := template.New("webpage").Parse(htmlTemplate)
	if err != nil {
		return nil, fmt.Errorf("error parsing template: %w", err)
	}

	type authResult struct {
		statusCode int
		html       string
		err        error
	}

	var onceAuthResult authResult

	mux := http.NewServeMux()
	mux.HandleFunc(cfg.callbackPath, func(w http.ResponseWriter, r *http.Request) {
		// only process the first callback result, ignoring any subsequent ones (there shouldn't be any).
		// Any subsequent requests will always send the outcome of the first result to the browser but
		// only the first result gets sent to the channel (which will then initiate a shutdown).
		cfg.onceRespCh.Do(func() {
			reqQry := r.URL.Query()
			authCode := reqQry.Get("code")
			errorMsg := reqQry.Get("error")
			state := reqQry.Get("state")

			var authResp *authorizationResponse
			switch {
			case errorMsg != "":
				authResp = &authorizationResponse{err: fmt.Errorf("authentication error: %s", errorMsg)}
			case authCode == "":
				authResp = &authorizationResponse{err: errors.New("no authorization code received")}
			case state != cfg.state:
				authResp = &authorizationResponse{err: errors.New("state does not match")}
			default:
				authResp = &authorizationResponse{code: authCode}
			}

			cfg.respCh <- authResp

			onceAuthResult = func() authResult {
				var data struct {
					Error   bool
					SiteURL string
				}
				var statusCode int

				if authResp.err != nil {
					data.Error = true
					statusCode = http.StatusBadRequest
				} else {
					statusCode = http.StatusOK
				}
				// TODO: The "login as a different user" flow needs to be improved. One way to do this would be to have the "Authorization Result" page live on the actual site so the localhost page
				// just redirects to a success/failure page but since it's on the site itself, the standard login/logout mechanisms become more obvious to the user. For now, the HTML emitted provides
				// instructions that the user must visit the site, logout and then run login from the CLI again. This flow is not ideal and should be improved.
				data.SiteURL = cfg.siteURL
				buf := bytes.Buffer{}
				err = t.Execute(&buf, data)
				if err != nil {
					return authResult{0, "", errors.New("error executing template - please close this tab and return to the CLI for details.")}
				}

				return authResult{statusCode, buf.String(), nil}
			}()
		})

		if onceAuthResult.err != nil {
			http.Error(w, onceAuthResult.err.Error(), http.StatusInternalServerError)
			return
		}

		// manually write the header to ensure status code set correctly in a failure scenario
		w.Header().Set("Content-Type", "text/html")
		w.WriteHeader(onceAuthResult.statusCode)
		fmt.Fprint(w, onceAuthResult.html)
	})

	return &http.Server{
		Handler: mux,
	}, nil
}
