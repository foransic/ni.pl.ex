﻿var request = require('request');
var builder = require('xmlbuilder');
var async = require('async');

call = function(url, res, success) {
  request.get(url, function(error, response, body) {
    if (error) {
      // something wrong happen, go back to activities with default error message
      res.render('activities.ejs', {error: 'DEFAULT'});
    } else {
      switch(response.statusCode) {
        case 200: 
          success(JSON.parse(body));        
          break;
        case 401: // auth failed, something wrong with tokens, go back to login with token timeout error message
          res.redirect('login');
          break;
        default: // something wrong happens, go back to activities with default error message
          res.render('activities.ejs', {error: 'DEFAULT'});
          break;
      }
    }
  });
}

exports.list = function(req, res) {
  call('https://api.nike.com/v1/me/sport/activities?access_token=' + req.session.token + '&count=1000', res, function(json) {
    jsonActivities = [];
    json.data.forEach(function(activity) {
      if (activity.status == 'COMPLETE') {
        jsonActivity = {
          'id' : activity.activityId,
          'url' : activity.links[0].href,
          'date' : activity.startTime,
          'type' : activity.activityType,
          'distance' : activity.metricSummary.distance,
          'duration' : activity.metricSummary.duration
        };
        jsonActivities.push(jsonActivity);
      }
    });
    res.render('activities.ejs', {activities: jsonActivities});
  });
}

exports.download = function(req, res) {
  activityId = req.params.activity;
  
  if (activityId == 'ALL') {
    // TODO manage the downloading of all activities
  } else {
    async.parallel([
      function(callback) {
        call('https://api.nike.com/v1/me/sport/activities/' + activityId + '?access_token=' + req.session.token, res, function(json) {
          callback(null, json);
        });
      },
      function(callback) {
        call('https://api.nike.com/v1/me/sport/activities/' + activityId + '/gps?access_token=' + req.session.token, res, function(json) {
          callback(null, json);
        });
      }],
      function (err, results) {
        activity = results[0];
        gps = results[1];
        
        var xml = builder.create('gpx', {version: '1.0', encoding: 'UTF-8'});
        xml.att('version', '1.1');
        xml.att('creator', 'Ni.Pl.Ex');
        xml.att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
        xml.att('xmlns', 'http://www.topografix.com/GPX/1/1');
        xml.att('xsi:schemaLocation', 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd');
        xml.att('xmlns:gpxtpx', 'http://www.garmin.com/xmlschemas/TrackPointExtension/v1');
        
        lastDate = new Date(activity.startTime);
        duration = activity.metricSummary.duration;
        // *1 is ugly, but it does the job ...
        durationInMillis = (duration.split(':')[0]*3600 + duration.split(':')[1]*60 + duration.split(':')[2].split('.')[0]*1)*1000;
        nbWpoints = gps.waypoints.length;
        secondInterval = durationInMillis/nbWpoints;

        interval = Math.round(durationInMillis/nbWpoints);
        milliInterval = interval%1000;
        secondInterval = (interval - milliInterval)/1000;
        trk= xml.ele('trk');
        trk.ele('name').dat(activity.activityType + ' ' + lastDate);
        trk.ele('time', activity.startTime);
        trkseg = trk.ele('trkseg');
        
        gps.waypoints.forEach(function(waypoint) {
          lastDate.setSeconds(lastDate.getSeconds() + secondInterval);
          lastDate.setMilliseconds(lastDate.getMilliseconds() + milliInterval);
          
          trkpt = trkseg.ele('trkpt', {'lat' : waypoint.latitude, 'lon' : waypoint.longitude});
          trkpt.ele('ele', waypoint.elevation)
          trkpt.ele('time', lastDate.toISOString());
        });

        res.set('Content-Disposition', 'attachment;filename="niplex_' + activity.startTime + '.gpx"');
        res.set('Content-Type', 'application/gpx+xml');
        res.send(xml.end({ pretty: true}));
      });

  }
}