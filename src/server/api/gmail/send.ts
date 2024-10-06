import { google } from "googleapis";

import type { Mail } from "~/types/Mail";
import { decryptAES256CTR } from "~/utils/crypto";
import { getOAuthClient, getTokenFromCookie, setTokenCookie } from "~/utils/OAuthClient";

export default defineEventHandler(async event => {
  const credentials = getTokenFromCookie(event);

  if (!credentials) {
    setResponseStatus(event, 401, "Unauthorized");
    return;
  }

  const { mode } = getQuery(event);

  const origin = getRequestProtocol(event) + "://" + getRequestHost(event);
  const oauthClient = getOAuthClient(origin);

  oauthClient.setCredentials(credentials);

  if (credentials?.expiry_date < Date.now()) {
    const { credentials } = await oauthClient.refreshAccessToken();
    setTokenCookie(event, credentials);
  }

  const contents: Mail[] = await readBody(event);


  const encodeUTF8Base64 = (value: string) => `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;

  const requests = contents.map(mail => {
    const rawMail = [
      `From: ${mail.from}`,
      `To: ${mail.to}`,
      `Subject: ${encodeUTF8Base64(mail.subject)}`,
      `Content-Type: text/plain; charset=utf-8`,
      "",
      mail.body
    ].join("\n");

    const base64EncodedMail = Buffer.from(rawMail, "utf-8").toString("base64");

    if (mode === "send") {
      return google.gmail({ version: "v1", auth: oauthClient }).users.messages.send({
        userId: "me",
        requestBody: { raw: base64EncodedMail }
      });
    }
    return google.gmail({ version: "v1", auth: oauthClient }).users.drafts.create({
      userId: "me",
      requestBody: { message: { raw: base64EncodedMail } }
    });
  });

  google.options({ http2: true });

  const results = await Promise.allSettled(requests);
  return results.map(result => {
    if (result.status === "fulfilled") {
      return result.value.data;
    } else {
      return { error: result.reason };
    }
  });
});
