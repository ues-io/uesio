package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strings"
)

// RequestContextInjector is a light wrapper handler which injects app/user context attributes
// into each log record, but otherwise delegates to the provided handler.
type RequestContextInjector struct {
	slog.Handler
}

func (h *RequestContextInjector) Handle(ctx context.Context, r slog.Record) error {
	session := GetSessionFromContext(ctx)
	request := GetRequestContext(ctx)

	// If there's no session context, there's nothing for us to do,
	// this is probably a log coming from a non-request context (such as app initialization/shutdown)
	if session != nil {
		site := session.GetSite()
		r.AddAttrs(
			slog.String("site", site.Name),
			slog.String("app", site.App.FullName),
			slog.String("user", session.GetContextUser().Username))
	}
	if request != nil {
		r.AddAttrs(
			slog.Group("request",
				slog.String("method", request.Method),
				slog.String("path", request.URL.Path),
				slog.String("referer", request.Header.Get("Referer")),
				slog.String("userAgent", request.Header.Get("User-Agent")),
				slog.String("ipAddress", getRemoteIp(request))))
	}

	return h.Handler.Handle(ctx, r)
}

func NewRequestContextInjector(
	handler slog.Handler,
) slog.Handler {
	return &RequestContextInjector{
		Handler: handler,
	}
}

// Request.RemoteAddress contains port, which we want to remove i.e.:
// "[::1]:58292" => "[::1]"
func ipAddrFromRemoteAddr(s string) string {
	idx := strings.LastIndex(s, ":")
	if idx == -1 {
		return s
	}
	return s[:idx]
}

// getRemoteIp returns ip address of the client making the request,
// taking into account http proxies
func getRemoteIp(r *http.Request) string {
	hdr := r.Header
	hdrRealIP := hdr.Get("X-Real-Ip")
	hdrForwardedFor := hdr.Get("X-Forwarded-For")
	if hdrRealIP == "" && hdrForwardedFor == "" {
		return ipAddrFromRemoteAddr(r.RemoteAddr)
	}
	if hdrForwardedFor != "" {
		// X-Forwarded-For is potentially a list of addresses separated with ","
		parts := strings.Split(hdrForwardedFor, ",")
		for i, p := range parts {
			parts[i] = strings.TrimSpace(p)
		}
		// TODO: should return first non-local address
		return parts[0]
	}
	return hdrRealIP
}
