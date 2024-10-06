import { google } from "googleapis";

import { encryptAES256CTR, decryptAES256CTR } from "./crypto";

import type { Auth } from "googleapis";
import type { H3Event } from "h3";

export const getOAuthClient = (host: string = "http://localhost:3000") => {
  const { googleCloudClientId, googleCloudClientSecret } = useRuntimeConfig();
  return new google.auth.OAuth2(
    googleCloudClientId as string,
    googleCloudClientSecret as string,
    new URL("/oauthcallback", host).toString()
  );
};

export const setTokenCookie = (event: H3Event, tokens: Auth.Credentials) => {
  const token = JSON.stringify(tokens);
  setCookie(event, "token", encryptAES256CTR(token), { httpOnly: true, secure: true, expires: new Date(tokens.expiry_date!) });
};

export const getTokenFromCookie = (event: H3Event) => {
  const token = getCookie(event, "token");
  if (!token) {
    return;
  }

  return JSON.parse(decryptAES256CTR(token)) as { access_token: string; expiry_date: number; refresh_token: string };
};
