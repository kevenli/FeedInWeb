from django.shortcuts import render
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse
import json
import logging
import os
import uuid
from django.conf import settings

# Create your views here.
def index(request):
    feeds = []
    for subdir in [x for x in os.walk(settings.FEED_STORAGE_DIR).next()[1]]:
        feeds.append({'feed_id': subdir})
    context = {
               'feeds' :feeds
               }
    return render(request, 'feeds/index.html', context)

def edit(request):
    context = {}
    if 'id' in request.GET and request.GET['id']:
        context['feed_id'] = request.GET['id']
    return render(request, 'feeds/edit.html', context)

@require_http_methods(["POST"])
def save(request):
    data = json.loads(request.POST['feedinfo'])
    if 'feed_id' in data and data['feed_id']:
        feed_id = data['feed_id']
    else:
        feed_id = str(uuid.uuid4())
        data['feed_id'] = feed_id
    folder = os.path.join( settings.FEED_STORAGE_DIR + '/' + feed_id)
    if not os.path.exists(folder):
        os.makedirs(folder)
    with open(folder + '/feed.json', 'w') as f:
        print folder
        f.write(json.dumps(data))
    
    response = {'result':'ok', 'feed_id' : feed_id}
    return HttpResponse(json.dumps(response))

def load(request):
    feed_id = request.GET['id']
    folder = os.path.join( settings.FEED_STORAGE_DIR + '/' + feed_id)
    with open(os.path.join(folder, 'feed.json'), 'r') as f:
        feed_data = f.read()
    return HttpResponse(feed_data)
    
def debug(request):
    pass
        
    