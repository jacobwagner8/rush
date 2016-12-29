# Phi Psi Cal Beta Rush Portal
*Bask in all its glory*

Welcome to the source code of the rush portal. In this readme, I'll try to explain the basics of web
development (that are relevant to the rush portal) as well as walk you through the existing code. 
I hope this readme is a useful reference!

## Web Dev basics

### What is a web application?
In the early days of the internet, websites were just pages. They were static and non-interactive. 
Today we have full-fledged web applications. This means that websites can be interactive, like an 
application you install. They can store data and allow different users to interact. Facebook and 
google are web applications that you probably use. 

### Where does the rush portal (or any website) live?
A website is a computer program. The computer running the website (the server) could be anywhere, 
physically, but the important thing is that it's connected to your computer (the client) over
internet. The rush portal lives on a cloud platform called Amazon Web Services, or AWS. Basically I 
pay Amazon money to run the rush portal on a computer that they own. As you work, you'll find that
it's easier to test the rush portal on your own computer. In this case, the server and client are 
the same computer. Wild!

### How the client interacts with the server
The client interacts with the server by making requests (called REST requests). These requests have 
the following structure:

     VERB, URL, DATA (e.g. GET http://www.google.com/#q=test)

In this case, the verb is GET, the URL is http://www.google.com, and the data is q=test (q is short 
for query).

The client can make 4 types of requests to the server: GET, POST, PUT, and DELETE. There's actually 
more, but 4 is really all you need. There's no rules that dictate how each request type is used, but
conventionally, they are used as follows: 

* GETs fetch resources without modifying them directly. 
* POSTs store new data in the application
* PUTs update data in the application
* DELETEs delete data in the application.

So when you first load a web page, your computer makes a GET to the page's URL. GETs are also issued
for loading other assets like pictures and script files. As you interact with the web app, your 
computer issues POSTs, PUTs, and DELETEs to send your actions to the server.

### Components of a web app
When I say that a website is a computer program, I'm simplifying things a bit. For a website like 
google, there are hundreds of computers running hundreds of little programs that work together to 
give you what you see. For the rush portal, and for most simple web applications, there are two 
components: The server and the database.

#### The server
The server is what the client talks to when you load a web page. It figures out what the client 
wants, fetches the relevant data from the database, then puts it all into a web page that it
returns to the client. Note that the server never stores any data itself. This is because managing 
data is hard. If the server died, we would lose data, and it's hard to manage simultaneous reads and
writes. Since managing the data is hard, people generally have a separate component (the database) 
that ONLY deals with managing data.

The rush portal server uses a program called Node (also called nodejs) that provides javascript 
libraries that make web programming really easy! 

#### The database
The database handles all of the data read and written by the application. It listens to the server 
for commands (called queries) to read or write something, then returns the data queried to the 
server. Writes are still called queries, and they often return data to the server despite not being 
reads (for example, whether the write is overwriting something). 

The rush portal database is a program called Postgres. Postgres is a SQL database, which means that 
data is stored in tables. Columns of the tables represent individual data fields for an object, and 
each row in a table represents one object of the type stored in that table. Data in one table can
refer to data in a different table, so this format allows you to capture complex relationships 
between objects (for example, that Eddie wrote comment X about Josh). You write queries in SQL, 
which is the language that Postgres understands.

TODO: example

Note: There's also a third component of the Rush Portal that handles only the storage of rushee 
pictures. It's called Amazon Simple Storage Service (S3), and you can think of it as a flash drive 
that works via REST requests.

### Programming the client (i.e. front end web dev)
At this point you might be thinking about HTML pages and wondering where those come in. HTML is the 
language that describes the layout of a web page, like a blueprint. It's what the server returns to 
the client after the client GETs a web page. The HTML page often indicates that the client 
should GET more resources, like stylesheets, pictures, and scripts. The client will automatically 
make these requests if they are written in the HTML. 

Stylesheets describe how web pages should look. They are in a language called CSS (Cascading Style 
Sheets). However, CSS sucks so I prefer to work in a nicer language called SASS that gets translated
to CSS.

Scripts make a web page interactive. You write them in javascript, and the client runs them as soon 
as it loads them from the server. Note that THE CLIENT runs scripts, not the server. Scripts 
generally control the user interface and send requests to the server. They will not handle the 
actual application logic, leaving that for the server. For example, a script might handle sending a 
POST with a user's comment when they click on the 'submit' button, but it won't talk to the database
directly to store the comment. 

### Programming the server (i.e. back end web dev)
The server's job can be divided somewhat neatly into 3 parts: Communicating with the client, 
handling the application logic (making database queries is part of this), and finally generating 
HTML pages to send to the client. For this reason, servers are usually coded in 3 parts: The model, 
the view, and the controller (often called the router). This paradigm is called MVC
(Model-View-Controller). The controller or router handles communicating with the client, the model 
handles the application logic, and the view handles generating HTML pages.

### Putting it all together
Let's follow what happens when a computer loads the rushee list page on the rush portal. Let's 
assume that the user is already logged on to the portal.

1. First, the computer makes a GET to "\" with its login token as data
2. The server receives the GET to "\", sees that the user is logged in, and knows that the request is for the rushee list (router.js:92)
3. The server queries the database for all the rushee data (router.js:96 ->  models.js:71)
4. The server renders the index view with the data it received from the model (router.js:99 -> views\index.jade)
5. The server sends the rendered HTML to the client (done automatically by a fancy library I'm using)

## Rush Portal Code Walkthrough

### Framework + Javascript

### Scaffolding

### Models

### Views

### Controllers (Routers)

### Database