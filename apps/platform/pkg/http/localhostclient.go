package http

import (
	"context"
	"net"
	"net/http"
	"strings"
	"time"
)

func NewLocalhostClient() *http.Client {
	return &http.Client{
		Transport: createCustomTransport(),
		// TODO: The previous code used the DefaultClient of zero which could lead to starvation
		// so setting this to 30 seconds which should theoretically be enough for current uesio
		// use cases.  This can be adjusted as needed until a full evaluation and refactor
		// of http client architecture/usage is completed.
		// See https://github.com/ues-io/uesio/issues/4781
		Timeout: 30 * time.Second,
	}
}

// Clone DefaultTransport but override DialContext
func createCustomTransport() *http.Transport {
	// Ensure we copy all default settings of http.DefaultTransport
	defaultTransport, _ := http.DefaultTransport.(*http.Transport)
	if defaultTransport == nil {
		panic("http.DefaultTransport is not of type *http.Transport")
	}

	// Clone http.DefaultTransport but override DialContext
	// TODO: All of these settings require review & consideration along
	// with how we create and use http clients in general.
	// See https://github.com/ues-io/uesio/issues/4781
	return &http.Transport{
		Proxy: defaultTransport.Proxy, // http.ProxyFromEnvironment
		DialContext: customDialContext(&net.Dialer{
			Timeout:   30 * time.Second, // same as DefaultTransport
			KeepAlive: 30 * time.Second, // same as DefaultTransport
		}), // Custom resolver for localhost
		ForceAttemptHTTP2:     defaultTransport.ForceAttemptHTTP2,     // true
		MaxIdleConns:          defaultTransport.MaxIdleConns,          // 100
		IdleConnTimeout:       defaultTransport.IdleConnTimeout,       // 90 * time.Second
		TLSHandshakeTimeout:   defaultTransport.TLSHandshakeTimeout,   // 10 * time.Second
		ExpectContinueTimeout: defaultTransport.ExpectContinueTimeout, // 1 * time.Second
		MaxIdleConnsPerHost:   defaultTransport.MaxConnsPerHost,       // 0 which means no limit per host
	}
}

// Custom DialContext function to enforce localhost resolution
func customDialContext(dialer *net.Dialer) func(context.Context, string, string) (net.Conn, error) {
	return func(ctx context.Context, network string, addr string) (net.Conn, error) {
		host, port, err := net.SplitHostPort(addr)
		if err != nil {
			return nil, err
		}

		// Ensure localhost and *.localhost always resolve to loopback
		// to avoid golang default behavior of making a DNS query
		// which would fail for any *.localhost address that doesn't have
		// an entry in the systems hosts file. This is the way browsers,
		// curl, etc. work and avoids the need for hosts entries for
		// localhost addresses which are intended to be used in uesio
		// dev environments.
		// NOTE - this is intended to simplify setup/config for uesio development
		// environments but will apply to ANY uesio environment. We only use
		// uesio.localhost by default in local development so we could check
		// suffix for uesio.localhost but the below mirrors what browsers/curl/etc. do
		if host == "localhost" || strings.HasSuffix(host, ".localhost") {
			loopbacks := []string{"::1", "127.0.0.1"}
			for _, loopback := range loopbacks {
				conn, err := dialer.DialContext(ctx, network, net.JoinHostPort(loopback, port))
				if err == nil {
					return conn, nil
				}
			}
			return nil, err // Return the last error if both fail
		}

		// Default dialer for non-localhost addresses
		return dialer.DialContext(ctx, network, addr)
	}
}
