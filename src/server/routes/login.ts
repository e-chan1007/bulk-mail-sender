import { getOAuthClient } from "~/utils/OAuthClient";

export default defineEventHandler(async event => {
  const origin = getRequestProtocol(event) + "://" + getRequestHost(event);
  const oauthClient = getOAuthClient(origin);
  const url = oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account",
    scope: [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.settings.basic"
    ]
  });
  await sendRedirect(event, url);
});
