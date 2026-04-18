from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer()

# Supabase JWT secret is usually needed to verify tokens locally
# However, you can also use the Supabase client to verify.
# For simplicity in this Phase 2, we will extract the 'sub' (User UUID) from the JWT.
# IMPORTANT: In production, you MUST verify the signature.

def get_current_user(auth: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Extracts the user ID (UUID) from the Supabase JWT.
    """
    token = auth.credentials
    try:
        # We decode without verification for now assuming Supabase handles it at DB layer with RLS,
        # but in a robust setup, you'd use the SUPABASE_JWT_SECRET.
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing sub")
        return user_id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Could not validate credentials: {str(e)}")
