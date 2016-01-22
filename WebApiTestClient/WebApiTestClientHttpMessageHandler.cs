using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Formatting;
using System.Net.Http.Headers;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Routing;
using Newtonsoft.Json;

namespace WebApiTestClient
{
    internal class WebApiTestClientHttpMessageHandler:HttpMessageHandler
    {


        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            object response = null;

            IDictionary<string, object> dictionary = request.GetRouteData().Values;
            object thing = null;
            if (dictionary.TryGetValue("thing", out thing))
            {
                response = ApiExplorerHelper.GetApi(thing.ToString());
            }
            else
            {
                response = ApiExplorerHelper.GetAPIs();
            }

            HttpResponseMessage httpResponseMessage = request.CreateResponse();

            httpResponseMessage.Content = new ObjectContent(response.GetType(),response, new JsonMediaTypeFormatter());

            return Task.FromResult(httpResponseMessage);
        }




    }

    internal class ResourceHttpMessageHandler:HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            IDictionary<string, object> dictionary = request.GetRouteData().Values;
            Stream manifestResourceStream = null;
            MediaTypeHeaderValue mediaType = null;
            object thing = null;
            if (dictionary.TryGetValue("thing", out thing) )
            {
                var sthing = thing.ToString().ToLowerInvariant();
                if (sthing == "script")
                {
                    manifestResourceStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("WebApiTestClient.WebApiTestClient.js");
                    mediaType = new MediaTypeHeaderValue("application/javascript");
                }
                else if(sthing == "styles")
                {
                    manifestResourceStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("WebApiTestClient.WebApiTestClient.styles.css");
                    mediaType = new MediaTypeHeaderValue("text/css");
                }
                else if(sthing == "templates")
                {
                    manifestResourceStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("WebApiTestClient.WebApiTestClient.templates.html");
                    mediaType = new MediaTypeHeaderValue("text/html");
                }
                else
                {
                    var apis = ApiExplorerHelper.GetAPIs();
                    if (apis.ApiNames.Contains(thing))
                    {
                        manifestResourceStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("WebApiTestClient.WebApiTestClient.api.html");
                        mediaType = new MediaTypeHeaderValue("text/html");
                    }
                    else {
                        return Task.FromResult(request.CreateResponse(HttpStatusCode.NotFound));
                    }
                }
            }
            else
            {
                manifestResourceStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("WebApiTestClient.WebApiTestClient.html");
                mediaType = new MediaTypeHeaderValue("text/html");
            }

            StreamContent content = new StreamContent(manifestResourceStream);
            content.Headers.ContentType = mediaType;
            HttpResponseMessage m = request.CreateResponse(HttpStatusCode.OK);
            m.Content = content;
            return Task.FromResult(m);

        }

        
    }

    public static class Extensions
    {
        public static void UseWebApiTestClient(this HttpConfiguration config)
        {
            ApiExplorerHelper.config = config;
            config.Routes.Add("__WebApiTestClient.apis", new HttpRoute("_WebApiTestClient/apis/{thing}", new HttpRouteValueDictionary(new { thing = RouteParameter.Optional }), null, null, new WebApiTestClientHttpMessageHandler()));
            config.Routes.Add("__WebApiTestClient", new HttpRoute("_WebApiTestClient/{thing}", new HttpRouteValueDictionary(new { thing = RouteParameter.Optional }), null, null, new ResourceHttpMessageHandler()));
            
        }
    }
}
