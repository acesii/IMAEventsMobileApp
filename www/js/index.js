/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */



var app = {
    // App DB Connection
    db: null,
    // A reusable error callback
    errorCB: function(err) {
      alert("Error processing SQL: "+err.code+" "+err.message);
    },
    // reusable success callback which does nothing. In debugging we might put an alert or console.log in here
    successCB: function() {
    },
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');

        // Open a database connection and store it at the app level
        app.db = openDatabase("evtdb", "1.0", "Event Database", 200000);

        // Create a new transaction, and invoke the "updateEventsData" method defined under "app"
        app.db.transaction(app.updateEventsData, app.errorCB, app.successCB);
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    updateEventsData: function(db_tx) {

      // Get highest timestamp or 0 if not yet stored
      var highest_timestamp_seen = window.localStorage.getItem("maxTS") || 0;

      alert("Starting with highest timestamp:"+highest_timestamp_seen);
      // Get or create our events table - list of events
      alert("Create");
      db_tx.executeSql('DROP TABLE IF EXISTS EVT', [], app.successCB, app.errorCB);
      db_tx.executeSql('CREATE TABLE IF NOT EXISTS EVT ( name , eventdate , address)', [], app.successCB, app.errorCB);
      db_tx.executeSql('INSERT INTO EVT (name,eventdate,address) VALUES ("a","b","c")', [], app.successCB, app.errorCB);

      alert("Create done looking for events since "+highest_timestamp_seen);

      // Now fetch the latest data
      $.ajax ({url:"http://localhost:8080/IMAEventsServer/UpcomingEvents/list/Sheffield?addedSince="+highest_timestamp_seen,
               dataType:"jsonp",
               async : false,
               success:function (data, textstatus, jqXHR) {
                         console.log("Processing %o",data);
                         for (index = 0; index < data.events.length; ++index) {

                           // Hand off to a special add event functon. Reusing the db_tx from above results in errors.
                           app.addEvent(db_tx,data.events[index].name,data.events[index].eventDate,data.events[index].address);

                           // Update our cursor if needed
                           if ( data.events[index].dateAdded > highest_timestamp_seen ) {
                             highest_timestamp_seen = data.events[index].dateAdded
                             alert("update to "+data.events[index].dateAdded);
                           }
                         }

                         // Store the highest timestamp seen
                         alert("update highest timestamp to "+highest_timestamp_seen);
                         window.localStorage.setItem("maxTS",highest_timestamp_seen);
                         alert("updateEventsData complete");
                       }
     
      });

    },
    addEvent: function(name, eventdate, address) {
      var ins_stmt = 'INSERT INTO EVT (name,eventdate,address) VALUES ("'+name+'","'+eventdate+'","'+address+'")';
      alert("Inserting "+ins_stmt);
      app.db.transaction( function(db_tx) {
                                       db_tx.executeSql(ins_stmt);
                                     },
                          app.errorCB, 
                          app.successCB);
    }
};
