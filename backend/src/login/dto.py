from pydantic import BaseModel
from typing import Optional


# Pydantic models
class EmailRequest(BaseModel):
    email: str

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    password: str

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str
    
class UserInfo(BaseModel):
    id: str
    email : str
    name : str
    jwt : str
    refresh :str
    
class UserToken(BaseModel):
    token : str    
    
    
    
    	
