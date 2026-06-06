import time
import threading

class RateLimiter:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(RateLimiter, cls).__new__(cls)
                    cls._instance.last_call = 0.0
        return cls._instance

    def wait(self, min_interval: float = 1.0):
        """Block until at least `min_interval` seconds have passed since the last call."""
        now = time.time()
        elapsed = now - self.last_call
        if elapsed < min_interval:
            time.sleep(min_interval - elapsed)
        self.last_call = time.time()

# Export a singleton for easy import
rate_limiter = RateLimiter()
