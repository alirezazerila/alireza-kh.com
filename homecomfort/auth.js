/* ---------------------------------------------------------------------------
   Firebase Authentication for the Home Comfort platform.

   Works on static hosting (GitHub Pages) because the browser talks to Google's
   auth servers directly. The real protection is the database security rules —
   this file only obtains the token those rules check.

   The API key below is NOT a secret. Firebase web API keys are public by
   design; security comes from the rules, never from hiding the key.
--------------------------------------------------------------------------- */
const FB_API_KEY  = "AIzaSyAyF5MvWRJG-54mZiuv9fR6DdUMXLsmAYk";
const SIGNIN_URL  = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + FB_API_KEY;
const REFRESH_URL = "https://securetoken.googleapis.com/v1/token?key=" + FB_API_KEY;
const LS_KEY      = "hc-auth";

const Auth = {
  idToken: null, refreshToken: null, expiresAt: 0, email: null,

  load(){
    try{
      const s = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if(s && s.refreshToken){ Object.assign(this, s); return true; }
    }catch(e){}
    return false;
  },
  save(){
    try{ localStorage.setItem(LS_KEY, JSON.stringify({
      idToken:this.idToken, refreshToken:this.refreshToken,
      expiresAt:this.expiresAt, email:this.email })); }catch(e){}
  },
  clear(){
    this.idToken=this.refreshToken=this.email=null; this.expiresAt=0;
    try{ localStorage.removeItem(LS_KEY); }catch(e){}
  },

  async signIn(email, password){
    const r = await fetch(SIGNIN_URL, {method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({email, password, returnSecureToken:true})});
    const j = await r.json();
    if(!r.ok){
      const code = (j.error && j.error.message) || "UNKNOWN";
      throw new Error(
        code==="INVALID_LOGIN_CREDENTIALS" || code==="EMAIL_NOT_FOUND" || code==="INVALID_PASSWORD"
          ? "That email and password don't match an account."
        : code==="USER_DISABLED" ? "This account has been disabled."
        : code.startsWith("TOO_MANY_ATTEMPTS") ? "Too many attempts. Wait a few minutes and try again."
        : "Sign-in failed (" + code + ")");
    }
    this.idToken=j.idToken; this.refreshToken=j.refreshToken;
    this.email=j.email; this.expiresAt=Date.now()+(+j.expiresIn-60)*1000;
    this.save(); return true;
  },

  /* Tokens last an hour; refresh before any request that needs one. */
  async token(){
    if(!this.refreshToken) return null;
    if(this.idToken && Date.now() < this.expiresAt) return this.idToken;
    try{
      const r = await fetch(REFRESH_URL, {method:"POST",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:"grant_type=refresh_token&refresh_token="+encodeURIComponent(this.refreshToken)});
      const j = await r.json();
      if(!r.ok) throw new Error("refresh failed");
      this.idToken=j.id_token; this.refreshToken=j.refresh_token;
      this.expiresAt=Date.now()+(+j.expires_in-60)*1000;
      this.save(); return this.idToken;
    }catch(e){ this.clear(); return null; }
  },
};
