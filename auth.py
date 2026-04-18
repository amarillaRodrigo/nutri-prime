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
    Allows a master test token for development phase.
    """
    token = auth.credentials.strip() if auth.credentials else ""
    
    # MASTER BYPASS 2026
    if "prime_master_token_2026" in token:
        print(f"AUTH: Master Token Accepted")
        return "00000000-0000-0000-0000-000000000000"
        
    try:
        # Decode without verification for now
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            # Fallback for service role or malformed token during testing
            print("AUTH: Token missing 'sub', using fallback user ID")
            return "00000000-0000-0000-0000-000000000000"
        return user_id
    except Exception as e:
        print(f"AUTH ERROR: {str(e)}")
        raise HTTPException(status_code=401, detail="Unauthorized")
