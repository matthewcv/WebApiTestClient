using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Formatting;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http.Routing;
using Newtonsoft.Json;

namespace WebApiTestClient
{
    public class WebApiTestClientHttpMessageHandler:HttpMessageHandler
    {

        //public void ProcessRequest(HttpContext context)
        //{

        //    object response = null;
        //    if (context.Request.QueryString["ApiName"] != null)
        //    {
        //        response = ApiExplorerHelper.GetApi(context.Request.QueryString["ApiName"]);
        //    }
        //    else
        //    {
        //        response =  ApiExplorerHelper.GetAPIs();
        //    }
        //    RespondJson(context,response );
        //}


        //private void RespondJson(HttpContext context, object content)
        //{
        //    context.Response.ContentType = "application/json";

        //    JsonSerializerSettings settings = new JsonSerializerSettings();
        //    settings.NullValueHandling = NullValueHandling.Ignore;
            
        //    context.Response.Write(JsonConvert.SerializeObject(content,settings));
        //}

        //public bool IsReusable { get { return false; } }

        //public IHttpHandler GetHttpHandler(RequestContext requestContext)
        //{
        //    return new HttpMessageHandler();
        //}

        //public static RouteBase GetRoute()
        //{
        //    return new Route("_WebApiTestClient",new RouteValueDictionary(new{controller="", action=""}), new HttpMessageHandler());
        //}


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



        public static void RegisterRouteForTestClient(System.Web.Http.HttpConfiguration config)
        {
            config.Routes.Add("__WebApiTestClient", new HttpRoute("_WebApiTestClient", null, null, null, new WebApiTestClientHttpMessageHandler()));
        }

    }
}
