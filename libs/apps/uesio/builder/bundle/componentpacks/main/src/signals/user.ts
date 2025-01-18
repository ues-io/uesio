import { SignalBandDefinition } from "../api/signalsapi"

// The key for the entire band
const BAND = "user"

// Metadata for all signals in the band
const signals: SignalBandDefinition = {
  band: BAND,
  label: "User",
  signals: {
    [`${BAND}/SIGNUP`]: {
      label: "Signup",
      description: "Signup",
      properties: () => [
        {
          name: "signupMethod",
          label: "Signup Method",
          type: "TEXT",
        },
        {
          name: "payload",
          label: "Payload",
          type: "TEXT", // TODO: Fix this
        },
      ],
    },
    [`${BAND}/LOGIN`]: {
      label: "Login",
      description: "Login",
      properties: () => [
        {
          name: "authSource",
          label: "Auth Source",
          type: "TEXT",
        },
        {
          name: "payload",
          label: "Payload",
          type: "TEXT", // TODO: Fix this
        },
      ],
    },
    [`${BAND}/LOGOUT`]: {
      label: "Logout",
      description: "Logout",
      properties: () => [],
    },
    [`${BAND}/RESET_PASSWORD`]: {
      label: "Reset Password",
      description: "Reset Password",
      properties: () => [
        {
          name: "authSource",
          label: "Auth Source",
          type: "TEXT",
        },
        {
          name: "payload",
          label: "Payload",
          type: "TEXT", // TODO: Fix this
        },
      ],
    },
    [`${BAND}/RESET_PASSWORD_CONFIRM`]: {
      label: "Reset Password Confirmation",
      description: "Reset Password Confirmation",
      properties: () => [
        {
          name: "authSource",
          label: "Auth Source",
          type: "TEXT",
        },
        {
          name: "payload",
          label: "Payload",
          type: "TEXT", // TODO: Fix this
        },
      ],
    },
    [`${BAND}/CREATE_LOGIN`]: {
      label: "Create Login",
      description: "Create a new login for a signup method",
      properties: () => [
        {
          name: "signupMethod",
          label: "Signup Method",
          type: "TEXT",
        },
        {
          name: "payload",
          label: "Payload",
          type: "TEXT", // TODO: Fix this
        },
      ],
    },
  },
}
export default signals
