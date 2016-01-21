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
            KeyValuePair<string, string> apiName = request.GetQueryNameValuePairs().FirstOrDefault(q => q.Key.Equals("ApiName", StringComparison.InvariantCultureIgnoreCase));

            object response = null;
            if (!apiName.Equals(default(KeyValuePair<string, string>)))
            {
                response = ApiExplorerHelper.GetApi(apiName.Value);
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
            object thing = null;
            if (dictionary.TryGetValue("thing", out thing) )
            {
                var sthing = thing.ToString().ToLowerInvariant();
                Stream manifestResourceStream = null;
                MediaTypeHeaderValue mediaType = null;
                if (sthing == "script")
                {
                    manifestResourceStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("WebApiTestClient.WebApiTestClient.js");
                    mediaType = new MediaTypeHeaderValue("application/javascript");
                }


                StreamContent content = new StreamContent(manifestResourceStream);
                content.Headers.ContentType = mediaType;
                HttpResponseMessage m = request.CreateResponse(HttpStatusCode.OK);
                m.Content = content;
                return Task.FromResult(m);
                

            }

            return Task.FromResult(request.CreateResponse(HttpStatusCode.NotFound));
        }

        
    }

    public static class Extensions
    {
        public static void UseWebApiTestClient(this HttpConfiguration config)
        {
            ApiExplorerHelper.config = config;
            config.Routes.Add("__WebApiTestClient.resources", new HttpRoute("_WebApiTestClient/{thing}", null, null, null, new ResourceHttpMessageHandler()));
            config.Routes.Add("__WebApiTestClient", new HttpRoute("_WebApiTestClient", null, null, null, new WebApiTestClientHttpMessageHandler()));
            
        }
    }
}
