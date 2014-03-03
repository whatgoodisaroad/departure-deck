# Departure Deck

This project is a submission to the Uber "Web Coding Challenge". What follows 
is a discussion of the topics requested in the challenge rules as well as basic
info on how to run the app, notes on the design and some gainful next steps for 
development.

## Project of Choice

I elected to produce the "Departure Times" application. There were a number of 
good reasons for this: the problem is defined with an agreeable amount of room
for me to exercise some creativity, there are some excellent APIs which are 
freely available, and, after my time using San Francisco public transit, I find 
it a compelling problem to try and solve.

## Technical Track

There is some ambiguity around exactly what technical stack I've taken. My 
intention, and what I think is spiritually the track I used, is frontend. 
However, in the end, a significant amount of programming effort went into 
building backend proxies for transit APIs (to deal with same-origin) and the 
amount of code in the backend makes it seem like a backend app.

My conclusion is that this is a full-stack project, even though it wasn't 
intended to be, and I haven't used any database technology. I think the truth of 
it is that, in order to make the front-end experience I envisioned, a nontrivial amount of backend was necessary.

## Reasoning Behind Technical Choices

There are so many technical choices that I'll break this discussion into 
sections.

### Backend Language/Framework

I chose to use JavaScript/Node.js. As Haskell was listed on the challenge 
readme, I initially wanted to use that (Haskell is my favorite language), but 
that would have caused unnecessary challenges. Haskell web frameworks are 
awkward, and hosting services are a bit more involved. By contrast, JavaScript 
(my second favorite language) and Node.js are not only easily hosted on Heroku
or similar, but they have excellent library support. I also have had favorable 
experience with express.js.

Thanks to this fortuitous decision, I was able to make ample use of the NPM set
of libraries.

### APIs / Proxies

Having chosen a language and framework, it was then possible to pursue the task 
of selecting an API and implementing a proxy. My initial notion was to choose 
511.org because I knew of it, and their developer materials were more easily 
navigated. It was a mistake to have gone forward with this idea before 
completely reading the API documentation as the 511.org dataset was 
insufficient for what I had planned on creating. (Specifically, it is deficient 
in good geospatial data.)

The result of this bad decision is a complete 511.js API proxy, which is not 
used, but preserved for posterity in the repository. (controller/511.js)

Fortunately, the skeleton of that proxy could be repurposed into a NextBus 
proxy (located at controller/nextbus.js) Structurally, these proxies define an 
internal set of API functions to be provided. In the code, this set is named 
`points`. These point definitions encode what is specific to an API function so 
that commonalities can be abstracted away, thereby minimizing code reuse.

An example such point is quoted below:

    routes:{
      command:"routeList",
      args:["a"], // a => agency
      parse:function(data, res) {
        xparse(data, function(result) {
          res(
            result
              .body
              .route
              .map(function(x) { return x.$; })
          );
        });
      }
    },

This tells the proxy system to create a GET url named "routes" which, when
invoked, collects an argument for "a" (by constructing an express.js route) 
and sends a request to the "routeList" command. As with 511.org, results can 
only be returned in XML format, so we parse the XML data using the "xml2js" 
NPM module and filter it for ease of consumption at the frontend.

An example invocation of this API point is below:

    GET /api/routes/sf-muni

    [
      {
        "tag": "F",
        "title": "F-Market & Wharves"
      },
      {
        "tag": "J",
        "title": "J-Church"
      },
      {
        "tag": "KT",
        "title": "KT-Ingleside/Third Street"
      },
      {
        "tag": "L",
        "title": "L-Taraval"
      },
      /* ... */
    ]

Another consideration regarding the APIs is acquiring the geographic locations
of transit stops. This information changes rarely (how often is a transit stop 
moved or a new one constructed?) so that information can be taken from a
dataset which is cached on disk and held in memory as the application runs.

This is not enough data to warrant the use of a database, however, insofar as it 
is geographic data, database-like query speed is desired. In particular, we'd 
like to be able to determine the transit-stops near a given location without 
having to traverse the entire set of stop locations. To do this, naturally, we 
need to construct some kind of geospatial index.

Luckily, there are a couple of NPM packages which can be used in tandem to 
produce this effect. I used the "rbush" package for spatial indexing via an 
R-Tree, and  "geolib" for computing linear distance from angular coordinates 
(meters from lat/lng).

To automate the process of constructing the index, the file 
scripts/construct-stop-geospatial-index.js reads an XML document of stops 
locations sourced from the NextBus API. Each one is encoded into the R-Tree and
the index is finally serialized to a JSON file for the application to load at 
launch. I discuss usage of the index in "Backend Organization".

### Backend Organization

There are three important files regarding the Backend: web.js, 
controller/nextbus.js and controller/geo.js. Web.js is the entry point for the 
application. It sets up the route which delivers the webpage (there's only the
index, since it's a one-page-app). It also sets up public folders for serving
frontend resources such as JavaScript, CSS files and clientside templates.

web.js also installs the two controllers. It loads the NextBus proxy, 
instructing it to initialize and to register routes for its API functions. the
NextBus proxy is discussed in "APIs / Proxies".

web.js also initializes geo.js and instructs it to register a handler. This 
controller behaves like the API proxy, except that it does not relay requests to 
NextBus, but queries against the geospatial index for finding nearby transit 
stops.

Critical to the execution of geo.js is its `findStops` function. This function
accepts a lat/lng as well as delta and limit arguments. It constructs a bounding
box from the lat/lng by adding and subtracting delta from the coordinates (i.e.
a rectangle encompassing the location). It then queries the geospatial index 
with the bounding box, sorts the results by ascending distance from the initial
lat/lng, and finally limits the number of results according to the limit 
argument.

These results are grouped by route and stop before being serialized into JSON 
for transmission back to the client.

### Frontend Organization

The frontend follows the somewhat common pattern of require.js for dependency
injection, and Backbone.js for code structure (although I don't use Backbone's 
MVC tools in this case). The frontend also makes extensive use of Bower for 
library management (similar to how NPM is used for the backend).

Among the Backbone models, app.js acts as a glue layer and defers specialized 
information-gathering tasks to other models. After the data has been gathered,
it is also concerned with rendering the data using Jade templates.

Other frontend models are described below:

* **API.js** A very simple set of functions which wrap JSON requests to the API.
* **Locator.js** A service for acquiring a lat/lng pair to use for location. May or
  may not be sourced from the HTML5 GeoLocation API, see "Using the App" for 
  details.
* **StopList.js** Able to acquire/store a list of transit-stops given a location.
* **Predictions.js** Able to acquire/store a list of departure time predictions 
  for the stops listed in a given StopList.

### Frontend Design

The frontend is intended to be a clean, clear representation of live and 
relevant data. I made what I interpret as a "flat" UI aesthetic, with particular
inspiration drawn from 1960's graphic design. The interface was also designed 
for mobile devices (as this is the most important use-case for a transit app) 
however, there is no need to differentiate the design between desktop and mobile.

![OSX Example](https://raw.github.com/whatgoodisaroad/departure-deck/master/public/img/osx.png)

![iOS Example](https://raw.github.com/whatgoodisaroad/departure-deck/master/public/img/ios.png)

### Running the App

I'm using the Heroku set of tools for Node.js development, so most of the 
dependencies can be automatically installed via the package.json and bower.json 
files.

### Using the App

As I am not physically in San Francisco (I'm in Oregon), I cannot directly test 
the geolocation aspect of the app. When in the city, one has merely to approve 
the HTML5 geolocate request and the app will attempt to find relevant transit 
stops for that position.

However, given my present location, and the time I can devote to this project, 
there are certain to be black hole lat/lngs where the data is incomplete.

To account for this, one can supply explicit lat/lng data via the URL hash. For
example, a location which works well is at:

    http://departure-deck.herokuapp.com/#37.759562,-122.426315

The hash is inspected at page load, so, if you change the hash manually, you 
must reload the page rather than simply hitting enter.

## Link to other code you're particularly proud of

I'm particularly proud of (and constantly amazed by the community response to)
jQuery.validity, which is a jQuery validation plugin I created and have been 
maintaining for several years. [Link](http://validity.thatscaptaintoyou.com)

## Public Profile

This is my personal GitHub account, so hopefully this speaks for itself as a 
public profile. My personal website is [here](http://thatscaptaintoyou.com).
