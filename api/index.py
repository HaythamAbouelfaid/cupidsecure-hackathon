import os
import sys

# Add root directory to python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Create a WSGI middleware to strip '/api/index'
class VercelWSGIWrapper:
    def __init__(self, application):
        self.application = application

    def __call__(self, environ, start_response):
        path_info = environ.get('PATH_INFO', '')
        
        # Next.js rewrites prepend /api/index to the paths
        # So we strip it so Flask's URL routing works properly
        if path_info.startswith('/api/index'):
            environ['PATH_INFO'] = path_info[10:] or '/'
            environ['SCRIPT_NAME'] = ''
            
        return self.application(environ, start_response)

app.wsgi_app = VercelWSGIWrapper(app.wsgi_app)
