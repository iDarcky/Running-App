# Strava & Google Fit Integration Security Guidelines

The original implementation of Strava and Google Fit OAuth integration relied on capturing the OAuth `client_secret` directly from the user and storing it in `localStorage`.

## Security Vulnerability (Fixed)
Storing OAuth client secrets on the client side (e.g., in a browser's `localStorage` or hardcoded in a frontend app) is a severe security vulnerability.

**Risk:**
If an attacker gains access to a user's client secret, they can spoof the application, potentially gaining unauthorized access to the user's data or abusing the API rate limits assigned to that application's credentials. Client secrets are intended to be kept confidential between the application provider and the authorization server.

## Recommended Architecture for OAuth
To implement OAuth securely for third-party services like Strava and Google Fit, a secure backend is required.

### 1. Backend Service
You need a backend server (e.g., Node.js/Express, Python/Django) or Serverless Functions (e.g., Vercel Functions, Supabase Edge Functions).

### 2. Secure Secret Storage
The `client_id` and `client_secret` provided by Strava/Google must be stored securely as environment variables on the backend server. They should **never** be sent to the client.

### 3. OAuth Flow Implementation
The Authorization Code Flow should be implemented as follows:
- **Initiation:** The frontend application redirects the user to the backend `/api/auth/strava` endpoint.
- **Redirection to Provider:** The backend generates an authorization URL with the `client_id`, requested `scopes`, and a secure `state` parameter, then redirects the user to Strava's authorization page.
- **User Authorization:** The user grants permission on Strava's site.
- **Callback:** Strava redirects the user back to the backend callback endpoint (e.g., `/api/auth/strava/callback`) with an authorization `code`.
- **Token Exchange:** The backend securely sends a POST request to Strava's token endpoint containing the `client_id`, `client_secret`, and the authorization `code`.
- **Token Storage:** The backend receives the `access_token` and `refresh_token`, storing them securely in a database associated with the user.
- **Frontend Access:** The backend redirects the user back to the frontend app. The frontend can now request data from the backend, which securely proxies requests to Strava using the stored tokens.

By following this architecture, the `client_secret` remains hidden, and the OAuth flow is secure.
