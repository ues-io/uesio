package middleware

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/fatih/color"
	"github.com/felixge/httpsnoop"
)

func byteCountDecimal(b int64) string {
	const unit = 1000
	if b < unit {
		return fmt.Sprintf("%dB", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f%cB", float64(b)/float64(div), "kMGTPE"[exp])
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

// requestGetRemoteAddress returns ip address of the client making the request,
// taking into account http proxies
func requestGetRemoteAddress(r *http.Request) string {
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

func getColoredResponseCode(code int) string {
	if code == 200 {
		return color.GreenString("%d", code)
	}
	return color.RedString("%d", code)
}

func LogRequestHandler(h http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, r *http.Request) {

		// I'm not sure why I have to do this, but if I don't, the colors
		// won't show in my terminal. Something about the color library
		// thinks it's not outputting to a real terminal.
		color.NoColor = false

		method := r.Method
		uri := r.URL.String()
		//referer := r.Header.Get("Referer")
		//userAgent := r.Header.Get("User-Agent")

		//ipAddr := requestGetRemoteAddress(r)

		// this runs handler h and captures information about
		// HTTP request
		m := httpsnoop.CaptureMetrics(h, w, r)

		session := GetSession(r)
		size := color.BlueString(byteCountDecimal(m.Written))
		duration := m.Duration.Round(time.Millisecond)
		timestamp := time.Now().Format(time.Kitchen)
		code := getColoredResponseCode(m.Code)
		site := color.CyanString(session.GetSite().GetFullName())
		user := color.MagentaString(session.GetContextUser().UniqueKey)

		log.Printf("[%v] %-4s %-32s %s %5s %16s %s %s\n", timestamp, method, uri, code, duration, size, site, user)
	}

	return http.HandlerFunc(fn)
}
