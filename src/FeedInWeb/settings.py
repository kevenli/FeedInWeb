"""
Django settings for FeedInWeb project.

For more information on this file, see
https://docs.djangoproject.com/en/1.7/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.7/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
BASE_DIR = os.path.dirname(os.path.dirname(__file__))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.7/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'jq)0#+!n@&s5a0%pko4yu@$u^r89dzaajwao-%01i5+5)-nbni'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

TEMPLATE_DEBUG = True

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes', 
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
    'pages',
    'users',
    'feeds',

)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    #'django.middleware.clickjacking.XFrameOptionsMiddleware', 
)

ROOT_URLCONF = 'FeedInWeb.urls'

WSGI_APPLICATION = 'FeedInWeb.wsgi.application'
AUTHENTICATION_BACKENDS = ('django.contrib.auth.backends.ModelBackend',)
#SESSION_COOKIE_DOMAIN = 'localhost'
SESSION_COOKIE_SECURE = False
# Database
# https://docs.djangoproject.com/en/1.7/ref/settings/#databases

DATABASES = {
        'default': {
        'ENGINE': 'django.db.backends.mysql',
        'HOST' : 'localhost',
        'NAME': 'feedin',
        'USER': 'feedin',
        'PASSWORD': 'feedin'
    }
}

# Internationalization
# https://docs.djangoproject.com/en/1.7/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Shanghai'

USE_I18N = True

USE_L10N = True

USE_TZ = True

SETTINGS_PATH = os.path.dirname(os.path.dirname(__file__))
TEMPLATE_DIRS = (
    os.path.join(SETTINGS_PATH, 'templates'),
)

LOGIN_URL = '/users/login'

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.7/howto/static-files/

STATIC_URL = '/static/'

STATICFILES_DIRS = (
    os.path.join(BASE_DIR, "static"),
    '/var/www/static/',
)

FEED_STORAGE_DIR = os.path.join(BASE_DIR, "feed_storage")
