import { encryptAES256CTR } from "~/utils/crypto";
import { getOAuthClient, setTokenCookie } from "~/utils/OAuthClient";

export default defineEventHandler(async event => {
  const { code } = getQuery(event);
  if (!code) {
    setResponseStatus(event, 400, "Bad Request");
    return;
  }

  const origin = getRequestProtocol(event) + "://" + getRequestHost(event);
  const oauthClient = getOAuthClient(origin);

  const { tokens } = await oauthClient.getToken(code as string);

  setTokenCookie(event, tokens);

  await sendRedirect(event, "/");
});
