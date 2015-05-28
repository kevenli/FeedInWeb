from django.shortcuts import render, redirect
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse
import json
import logging
import os
import uuid
from django.conf import settings
import feedin
from feeds.models import Feed
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.decorators import login_required

@login_required
def index(request):
    feeds = Feed.objects.filter(owner_id=request.user.id)
    context = {
               'feeds' :feeds
               }
    return render(request, 'feeds/index.html', context)

@login_required
def edit(request):
    context = {}
    if 'id' in request.GET and request.GET['id']:
        context['feed_id'] = request.GET['id']
    return render(request, 'feeds/edit.html', context)

@require_http_methods(["POST"])
@login_required
def save(request):
    data = json.loads(request.POST['feedinfo'])
    if 'feed_id' in data and data['feed_id']:
        feed_id = data['feed_id']
    else:
        feed_id = str(uuid.uuid4())
        data['feed_id'] = feed_id
#     folder = os.path.join( settings.FEED_STORAGE_DIR + '/' + feed_id)
#     if not os.path.exists(folder):
#         os.makedirs(folder)
#     with open(folder + '/feed.json', 'w') as f:
#         print folder
#         f.write(json.dumps(data))
    try:
        new_feed = Feed.objects.get(guid=feed_id)
    except ObjectDoesNotExist:
        new_feed = Feed(guid = feed_id)
        new_feed.create_time = timezone.now()
        new_feed.owner_id = request.user.id
    
    new_feed.title = 'demo'
    new_feed.desc = 'demo'
    new_feed.conf = json.dumps(data)
    new_feed.version = new_feed.version + 1
    new_feed.update_time = timezone.now()
    new_feed.save()
    
    response = {'result':'ok', 'feed_id' : feed_id}
    return HttpResponse(json.dumps(response))

@login_required
def load(request):
    feed_id = request.GET['id']
#     folder = os.path.join( settings.FEED_STORAGE_DIR + '/' + feed_id)
#     with open(os.path.join(folder, 'feed.json'), 'r') as f:
#         feed_data = f.read()
    feed_data = Feed.objects.get(guid = feed_id).conf
    feed_model = json.loads(feed_data)
    feed_model['feed_id'] = feed_id
    feed_data = json.dumps(feed_model)
    return HttpResponse(feed_data)
    
@login_required
def debug(request):
    feed_def = request.POST['_def'];
    engine = feedin.engine.Engine()
    job = engine.create(feed_def)
    job.execute()
    ret = json.dumps(job.context.items)
    return HttpResponse(ret)
        
    