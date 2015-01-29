using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace WebApiTestClient.Web.Controllers
{
    [RoutePrefix("TestAttributeRouting")]
    public class TestAttributeRoutingController : ApiController
    {
        [HttpGet, Route("StringListInQuery")]
        public List<string> StringListInQuery([FromUri]List<string> things)
        {
            return things;
        }

        [HttpGet, Route("StringInQuery")]
        public string StringsInQuery([FromUri]string thing, string anotherThing)
        {
            return thing + ", " + anotherThing;
        }

        [HttpGet, Route("StringsInPath/{whatever}/{another}")]
        public string StringsInPath(string whatever, string another)
        {
            return whatever + ", " + another;
        }

        [HttpPost, Route("ListOfObjectsAsParameter")]
        public List<Something> ListOfObjectsAsParameter(List<Something> things)
        {
            return things;
        }

        /// <summary>
        /// not working
        /// </summary>
        /// <param name="things"></param>
        /// <returns></returns>
        [HttpPost, Route("ListOfStringsAsParameter")]
        public List<string> ListOfStringsAsParameter(List<string> things)
        {
            return things;
        }

        [HttpPost, Route("ObjectParameterWithListOfObjectsProperty")]
        public Another ObjectParameterWithListOfObjectsProperty(Another thing)
        {
            return thing;
        }

        [HttpPost, Route("ObjectParameterWithListOfStringsProperty")]
        public Thing ObjectParameterWithListOfStringsProperty(Thing thing)
        {
            return thing;
        }

        [HttpPost, Route("ObjectParameterWithNestedObjectProperty")]
        public Something ObjectParameterWithNestedObjectProperty(Something thing)
        {
            return thing;
        }


        [HttpPost, Route("ObjectParameterWithStringStringDictionaryProperty")]
        public Marglar ObjectParameterWithStringStringDictionaryProperty(Marglar thing)
        {
            return thing;
        }


        [HttpPost, Route("StringStringDictionaryAsParameter")]
        public Dictionary<string, string> StringStringDictionaryAsParameter(Dictionary<string, string> things)
        {
            return things;
        }


        [HttpPost, Route("IntDateDictionaryAsParameter")]
        public Dictionary<int, DateTime> IntDateDictionaryAsParameter(Dictionary<int, DateTime> things)
        {
            return things;
        }

        /// <summary>
        /// not working
        /// </summary>
        /// <param name="things"></param>
        /// <returns></returns>
        [HttpPost, Route("IntObjectDictionaryAsParameter")]
        public Dictionary<int, Something> IntObjectDictionaryAsParameter(Dictionary<int, Something> things)
        {
            return things;
        }
    }

    public class Something
    {
        public string StringProp { get; set; }

        public int IntProp { get; set; }

        public Marglar TheAnother { get; set; }
    }


    public class Another
    {
        public string AnotherString { get; set; }

        public List<Something> Somethings { get; set; }
    }

    public class Marglar
    {
        public string Blah { get; set; }

        public DateTime Belch { get; set; }

        public int HowMany { get; set; }

    }
    public class Thing
    {
        public string AnotherString { get; set; }

        public List<string> Strings { get; set; }
    }
}
