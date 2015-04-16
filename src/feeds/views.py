from django.shortcuts import render

# Create your views here.
def index(request):
    context = {}
    return render(request, 'feeds/index.html', context)

def edit(request):
    context = {}
    return render(request, 'feeds/edit.html', context)