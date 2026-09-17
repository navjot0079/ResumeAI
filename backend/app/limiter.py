from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared slowapi rate limiter instance keyed by client IP address
limiter = Limiter(key_func=get_remote_address)
