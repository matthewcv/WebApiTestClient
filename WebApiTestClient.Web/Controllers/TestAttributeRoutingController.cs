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


        [HttpPost, Route("ObjectParameterWithSimpleProperties")]
        public ClassWithSimpleProperties ObjectParameterWithSimpleProperties(ClassWithSimpleProperties param)
        {
            return param;
        }

        [HttpPost, Route("ObjectParameterWithComplexProperty")]
        public ClassWithComplexObjectProperty ObjectParameterWithComplexProperty(ClassWithComplexObjectProperty param)
        {
            return param;
        }


        [HttpPost, Route("ListOfObjectsAsParameter")]
        public List<ClassWithComplexObjectProperty> ListOfObjectsAsParameter(List<ClassWithComplexObjectProperty> things)
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
        public ClassWithObjectListProperty ObjectParameterWithListOfObjectsProperty(ClassWithObjectListProperty thing)
        {
            return thing;
        }

        [HttpPost, Route("ObjectParameterWithListOfStringsProperty")]
        public ClassWithStringListParameter ObjectParameterWithListOfStringsProperty(ClassWithStringListParameter thing)
        {
            return thing;
        }

        [HttpPost, Route("ObjectParameterWithNestedObjectProperty")]
        public ClassWithComplexObjectProperty ObjectParameterWithNestedObjectProperty(ClassWithComplexObjectProperty thing)
        {
            return thing;
        }


        [HttpPost, Route("ObjectParameterWithStringStringDictionaryProperty")]
        public ClassWithStringDictionaryProp ObjectParameterWithStringStringDictionaryProperty(ClassWithStringDictionaryProp thing)
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
        public Dictionary<int, ClassWithComplexObjectProperty> IntObjectDictionaryAsParameter(Dictionary<int, ClassWithComplexObjectProperty> things)
        {
            return things;
        }
    }

    public class ClassWithComplexObjectProperty
    {
        public string StringProp { get; set; }

        public int IntProp { get; set; }

        public ClassWithSimpleProperties TheAnother { get; set; }
    }


    public class ClassWithStringDictionaryProp
    {
        public string StringProp { get; set; }

        public int IntProp { get; set; }

        public Dictionary<string, string> TheDict { get; set; } 
    }

    public class ClassWithObjectListProperty
    {
        public string AnotherString { get; set; }

        public List<ClassWithSimpleProperties> Somethings { get; set; }
    }

    

    public class ClassWithSimpleProperties
    {
        public string Blah { get; set; }

        public DateTime Belch { get; set; }

        public int HowMany { get; set; }

        public bool IsIt { get; set; }

    }
    public class ClassWithStringListParameter
    {
        public string AnotherString { get; set; }

        public List<string> Strings { get; set; }
    }
}
