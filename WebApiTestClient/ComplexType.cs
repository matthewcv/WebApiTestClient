using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebApiTestClient
{
    public class ComplexType
    {
        public string Name { get; set; }

        public List<ApiParameter> Properties { get; set; } 
    }
}
