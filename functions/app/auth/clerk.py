from __future__ import annotations

import json
import os
import time
from typing import Any

import jwt
import requests
from jwt import algorithms

_JWKS_CACHE: dict[str, Any] = {
    "expires_at": 0.0,
    "keys": {},
}


def _get_jwks_url() -> str:
    url = os.environ.get("CLERK_JWKS_URL")
    issuer = os.environ.get("CLERK_ISSUER")
    if url:
        return url
    if not issuer:
        raise ValueError("Missing CLERK_JWKS_URL or CLERK_ISSUER")
    return issuer.rstrip("/") + "/.well-known/jwks.json"


def _fetch_jwks() -> dict[str, dict[str, Any]]:
    url = _get_jwks_url()
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    payload = response.json()
    keys = {key["kid"]: key for key in payload.get("keys", []) if "kid" in key}
    _JWKS_CACHE["keys"] = keys
    _JWKS_CACHE["expires_at"] = time.time() + 3600
    return keys


def _get_jwk(kid: str) -> dict[str, Any] | None:
    if not _JWKS_CACHE.get("keys") or time.time() > _JWKS_CACHE.get("expires_at", 0):
        _fetch_jwks()
    keys = _JWKS_CACHE.get("keys", {})
    if kid not in keys:
        _fetch_jwks()
        keys = _JWKS_CACHE.get("keys", {})
    return keys.get(kid)


def verify_clerk_jwt(token: str) -> dict[str, Any]:
    issuer = os.environ.get("CLERK_ISSUER")
    audience = os.environ.get("CLERK_AUDIENCE")

    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    if not kid:
        raise ValueError("Token missing kid")

    jwk = _get_jwk(kid)
    if not jwk:
        raise ValueError("Unable to find matching JWK")

    public_key = algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))
    options = {"verify_aud": bool(audience)}
    payload = jwt.decode(
        token,
        public_key,
        algorithms=["RS256"],
        issuer=issuer,
        audience=audience,
        options=options,
    )
    return payload


def get_bearer_token(headers: dict[str, str]) -> str | None:
    auth_header = headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header.split(" ", 1)[1].strip()
