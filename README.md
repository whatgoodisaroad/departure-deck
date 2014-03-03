# Departure Deck

This project is a submission to the Uber "Web Coding Challenge". What follows 
is a discussion of the topics requested in the challenge rules as well as basic,
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
intention, and what I think is spiritually the track used, is the front-end 
track. This is the space which is most interesting to me. However, in actuality,
a significant amount of programming effort had gone into building backend 
proxies for transit APIs (to circumvent same-origin) and the amount of code in 
the backend makes it seem like a backend app.

I suppose the conclusion is that this is a full-stack project, even though it
wasn't intended to be, and I haven't used any database technology.

I think the truth of it is that, in order to make the front-end experience I 
envisioned, a nontrivial amount of backend was necessary. I'm reminded of the 
quote of Alan Kay's: "People who are really serious about software should make 
their own hardware." Likewise, I think that people who are serious about 
frontend, should make their own backend.

## Reasoning Behind Technical Choices

There are so many technical choices, that I'll break this discussion into 
sections.

### Backend Language/Framework

I chose to use JavaScript/Node.js. As Haskell was listed on the challenge 
readme, I initially wanted to use that (Haskell is my favorite language), but 
that would have caused unnecessary challenges. Haskell web frameworks are 
awkward, and hosting services are a bit more involved. By contrast, JavaScript 
(my second favorite language) and Node.js are not only easily hosted on Heroku
or similar, but they have excellent library support. I also have favorable 
experience with express.js.

Thanks to this fortuitous decision, I was able to make ample use of the NPM set
of libraries.

### APIs / Proxies

Having chosen a language and framework, it was then possible to pursue the task 
of selecting an API and implementing a proxy. My initial notion was to choose 
511.org because I knew it, and their developer materials were more easily 
navigated. It was a mistake to have gone forward with this idea before 
completely reading the API documentation, as the 511.org dataset was 
insufficient for what I had planned on creating (specifically, it is deficient 
in good geospatial data).

The result of this bad decision is a complete 511.js API proxy, which is not 
used, but preserved for posterity in the repository. (controller/511.js)

Fortunately, the skeleton of that proxy could be repurposed into a NextBus 
proxy (located at controller/nextbus.js) Structurally, these proxies defined an 
internal set of API points to provide. In the code, this set is named `points`.
These point definitions specify what is not common between API points so that 
commonalities can be abstracted away, thereby minimizing code reuse.

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

This tells the proxy system to create a public url named "routes" which, when
invoked, collects an argument for "a" (by constructing an express.js route) 
and sends a request to the "routeList" command. As with 511.org, results can 
only be returned in XML format, so we parse the XML data using the "xml2js" 
NPM module and filter it for ease of consumption from the frontend.

## Link to other code you're particularly proud of

## Link to your resume or public profile

Prompt quoted below:

>Create a service that gives real-time departure time for public transportation (use freely available public API). The app should geolocalize the user.
>
>Here are some examples of freely available data:
>
>511 (San Francisco)
>Nextbus (San Francisco)
