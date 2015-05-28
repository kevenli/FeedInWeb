from django.shortcuts import render, redirect
from django.contrib.auth import authenticate
import django.contrib.auth

def login(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                django.contrib.auth.login(request, user)
                if request.GET['next']:
                    return redirect(request.GET['next'])
                else:
                    return redirect('/')
    context = {}
    return render(request, 'users/login.html', context)

def logout(request):
    django.contrib.auth.logout(request)
    return render(request, 'users/login.html', {})