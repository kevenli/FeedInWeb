from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.contrib.auth import views as auth_views

admin.autodiscover()
urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'FeedInWeb.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^users/', include('users.urls')),
    url(r'^feeds/', include('feeds.urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', 'pages.views.index', name='index'),
    url(r'^accounts/login/$', auth_views.login),
    
)
