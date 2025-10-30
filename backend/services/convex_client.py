import os
import requests

CONVEX_URL = os.getenv("CONVEX_URL")
if not CONVEX_URL:
    raise RuntimeError("CONVEX_URL environment variable not set")

def convex_query(function_name: str, args: dict = None):
    url = f"{CONVEX_URL}/api/query/{function_name}"
    resp = requests.post(url, json=args or {})
    resp.raise_for_status()
    return resp.json()

def convex_mutation(function_name: str, args: dict = None):
    url = f"{CONVEX_URL}/api/mutation/{function_name}"
    resp = requests.post(url, json=args or {})
    resp.raise_for_status()
    return resp.json()