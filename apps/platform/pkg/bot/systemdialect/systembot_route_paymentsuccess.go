package systemdialect

import (
	"time"

	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/checkout/session"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func mutateRoute(route *meta.Route) {
	route.ViewRef = "uesio/studio.userpayments"
	route.Namespace = "uesio/studio"
	route.Path = "mypayments"
	route.ThemeRef = "uesio/studio.default"
	route.Params = nil
	route.Name = "userpayments"
}

func runPaymentSuccessRouteBot(route *meta.Route, uesioSession *sess.Session) error {

	anonSession := sess.GetStudioAnonSession()
	stripeKey, err := datasource.GetSecretFromKey("uesio/studio.stripe_key", anonSession)
	if err != nil {
		mutateRoute(route)
		return nil
	}
	stripe.Key = stripeKey
	checkoutSessionID := route.Params["session_id"]

	checkoutSession, err := session.Get(checkoutSessionID, nil)
	if err != nil {
		mutateRoute(route)
		return nil
	}

	if checkoutSession.PaymentStatus != "paid" {
		mutateRoute(route)
		return nil
	}

	payment := &meta.Payment{
		User: &meta.User{
			BuiltIn: meta.BuiltIn{
				ID: checkoutSession.ClientReferenceID,
			},
		},
		Date:    time.Now().Format("2006-01-02"),
		Total:   float64(checkoutSession.AmountTotal) / 100,
		Payment: checkoutSession.PaymentIntent.ID,
	}

	err = datasource.PlatformSaveOne(payment, nil, nil, uesioSession)
	if err != nil {
		mutateRoute(route)
		return nil
	}

	return nil
}
