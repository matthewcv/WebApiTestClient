WebApiTestClient

For ASP.Net Web API projects.  Use to automatically generate a UI in the browser for testing the APIs.  
* Good for quickly testing your APIs as you develop them
* Good for QA teams that need to test your API 
* Good for using web app automation tools like web driver or phantomjs for testing the API

How to use:

1. Install the matthewcv.WebApiTestClient NuGet package into your Web API Project.
2. If it's not already there, install the Microsoft.AspNet.WebApi.HelpPage NuGet Package.
3. In your web app under /Ares/HelpPage/Views/Help there should be a view called Api.cshtml.  Add this code to the bottom of that file:
   ```
	@section scripts
	{
   		<script type="text/javascript" src="/Scripts/WebApiTestClient.js"></script>
	}
   ```	
4. Register the route.  In your Global.asax or where ever you register your routes add this line: ```WebApiTestClient.WebApiTestClientHttpMessageHandler.RegisterRouteForTestClient(GlobalConfiguration.Configuration);```.  This route must be registered first before any other routes.
5. Browse to one of the generated Help pages for an API.  The WebApiTestClient will initialize automatically and after a moment you will see a "Test this API" link at the bottom rigt of the window
	if you click it, a UI will be generated that matches the inputs for that API.  Fill them in and click the 'send request' button.



* it uses handlebars to generate the UI.  Handlebars is not included with the package.  Rather, it loads it from CDNJS.
* this is just an initial version and doesn't do very much.  There may be bugs and it may not handle all your routes or parameters.  You can add an issue for a bug or feature request or  send a pull reqest on the GitHub repo.
* right now it does need the WebApi Help page but later on, I'll remove that requirement.
* it doesn't do any kind of validation right now so you can easily put bad inputs that could cause unexpected bahavior on the client or server.
