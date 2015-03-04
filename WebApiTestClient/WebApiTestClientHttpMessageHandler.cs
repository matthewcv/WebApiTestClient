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
