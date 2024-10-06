import { google } from "googleapis";

import { decryptAES256CTR } from "~/utils/crypto";
import { getOAuthClient, getTokenFromCookie, setTokenCookie } from "~/utils/OAuthClient";

export default defineEventHandler(async event => {
  const credentials = getTokenFromCookie(event);

  if (!credentials) {
    setResponseStatus(event, 401, "Unauthorized");
    return;
  }

  const origin = getRequestProtocol(event) + "://" + getRequestHost(event);
  const oauthClient = getOAuthClient(origin);

  oauthClient.setCredentials(credentials);

  if (credentials?.expiry_date < Date.now()) {
    const { credentials } = await oauthClient.refreshAccessToken();
    setTokenCookie(event, credentials);
  }

  const list = await google.gmail({ version: "v1", auth: oauthClient }).users.settings.sendAs.list({ userId: "me" });

  return list.data.sendAs
    ?.filter(value => value.verificationStatus !== "pending")
    ?.map(value => ({
      address: value.sendAsEmail || "",
      label: `${value.displayName} <${value.sendAsEmail}>`,
      primary: Boolean(value.isPrimary),
      default: Boolean(value.isDefault)
    })) ?? [];
});
