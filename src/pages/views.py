from django.shortcuts import render, redirect
from django.conf import settings

# Create your views here.
def index(request):
    if not request.user.is_authenticated():
        return redirect('%s?next=%s' % (settings.LOGIN_URL, request.path))
    context = {}
    return render(request, 'index.html', context)