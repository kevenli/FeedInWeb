from django.db import models

# Create your models here.
class Feed(models.Model):
    guid = models.CharField(max_length=36, unique=True)
    owner_id = models.IntegerField()
    title = models.CharField(max_length=100)
    desc = models.CharField(max_length=200)
    conf = models.TextField()
    version = models.IntegerField(default=0)
    update_time = models.DateTimeField()
    create_time = models.DateTimeField()
    enabled = models.BooleanField()
