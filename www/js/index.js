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
    // Application Constructor
    initialize: function() {
        this.bindEvents();

        // Open a database connection and store it at the app level
        this.db = window.openDatabase("Database", "1.0", "PhoneGap Demo", 200000);

        // Create a new transaction, and invoke the "updateEventsData" method defined under "app"
        this.db.transaction(this.updateEventsData,
                            function(err) {
                              // Error Callback
                              alert("Error "+err);
                            },
                            function() {
                              // Success Callback
                              alert("OK");
                            });
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
    updateEventsData: function(tx) {

      // Get highest timestamp or 0 if not yet stored
      var highest_timestamp_seen = window.localStorage.getItem("maxTS") || 0;

      // Get or create our events table - list of events
      tx.executeSql('CREATE TABLE IF NOT EXISTS EVENT ( id unique, name, event_date, address )');

      // Now fetch the latest data
      $.getJSON ("http://localhost:8080/IMAEventsServer/UpcomingEvents/list/Sheffield?addedSince="+highest_timestamp_seen,
        function (data) {
          for (index = 0; index < data.events.length; ++index) {
            tx.executeSql('INSERT INTO EVENT(name,event_date,address) VALUES ("'+
                                      data.events[index].name+'","'+
                                      data.events[index].eventDate+'","'+
                                      data.events[index].address+'")');
            alert("Added "+data.events[index]);

            // Update our cursor if needed
            if ( data.events[index].dateAdded > highest_timestamp_seen )
              highest_timestamp_seen = data.events[index].dateAdded
          }
        }
      );

      // Store the highest timestamp seen
      window.localStorage.setItem("maxTS",highest_timestamp_seen);
    }
};
