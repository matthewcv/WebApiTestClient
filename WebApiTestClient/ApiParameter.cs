using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebApiTestClient
{
    public class ApiParameter
    {
        public string TypeName { get; set; }
        public string KeyTypeName { get; set; }
        public string ValueTypeName { get; set; }
        public string Name { get; set; }

        public bool IsSimple { get; set; }
        public bool IsList { get; set; }
        public bool IsDictionary { get; set; }
    }
}
