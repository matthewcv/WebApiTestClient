using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebApiTestClient
{
    public class ApiInfo
    {
        public string Name { get; set; }

        public string Route { get; set; }

        public string Method { get; set; }

        public List<ApiParameter> QueryParameters { get; set; }

        public List<ApiParameter> RouteParameters { get; set; }

        public ApiParameter BodyParameter { get; set; }

        public List<ComplexType> ComplexTypes { get; set; } 

    }
}
