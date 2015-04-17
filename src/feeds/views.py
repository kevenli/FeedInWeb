from django.shortcuts import render
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse
import json
import logging
import os
import uuid

# Create your views here.
def index(request):
    context = {}
    return render(request, 'feeds/index.html', context)

def edit(request):
    context = {}
    return render(request, 'feeds/edit.html', context)

@require_http_methods(["POST"])
def save(request):
    data = json.loads(request.POST['feedinfo'])
    if 'feed_id' in data and data['feed_id']:
        feed_id = data['feed_id']
    else:
        feed_id = str(uuid.uuid4())
    folder = os.path.join( os.path.dirname(__file__), 'storage/' + feed_id)
    if not os.path.exists(folder):
        os.makedirs(folder)
    with open(folder + '/feed.json', 'w') as f:
        print folder
        f.write(json.dumps(data))
    
    response = {'result':'ok', 'feed_id' : feed_id}
    return HttpResponse(json.dumps(response))
        
    