using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Web.Http.Description;

namespace WebApiTestClient
{
    public static class ApiExplorerHelper
    {
        private static Dictionary<string, Type> _typeCache = new Dictionary<string, Type>(); 

        public static ApiNamesInfo GetAPIs()
        {
            IApiExplorer apiExplorer = System.Web.Http.GlobalConfiguration.Configuration.Services.GetApiExplorer();

            List<ApiDescription> apiDescriptions = apiExplorer.ApiDescriptions.ToList();

            return new ApiNamesInfo{ ApiNames= apiDescriptions.Select(d => d.GetFriendlyId()).ToList()};

        }

        public static ApiInfo GetApi(string name)
        {
            IApiExplorer apiExplorer = System.Web.Http.GlobalConfiguration.Configuration.Services.GetApiExplorer();
            ApiDescription desc = apiExplorer.ApiDescriptions.FirstOrDefault(a => a.GetFriendlyId() == name);

            return GetApiINfo(desc);
        }


        private static ApiInfo GetApiINfo(ApiDescription desc)
        {
            var api = new ApiInfo() { Name = desc.GetFriendlyId() };


            api.Method = desc.HttpMethod.Method;
            api.Route = desc.Route.RouteTemplate;
            api.RouteParameters = GetRouteParameters(desc);
            api.QueryParameters = GetQueryParameters(desc);
            api.BodyParameter = GetBodyParameter(desc);
            api.ComplexTypes = GetComplexTypes(api.BodyParameter);
            return api;
        }

        private static List<ComplexType> GetComplexTypes(ApiParameter param)
        {
            List<ComplexType> types = new List<ComplexType>();

            AddToComplexTypesList(types,param);

            return types;
        }

        private static void AddToComplexTypesList(List<ComplexType> list, ApiParameter param)
        {
            if (param != null)
            {
                string typeName = param.TypeName ?? param.ValueTypeName;
                if (!list.Any(c => c.Name == typeName) && !param.IsSimple)
                {
                    Type type = _typeCache[typeName];
                    ComplexType ct = new ComplexType();
                    list.Add(ct);
                    ct.Name = type.FullName;
                    ct.Properties = new List<ApiParameter>();
                    PropertyInfo[] propertyInfos = type.GetProperties(BindingFlags.Instance | BindingFlags.Public);
                    foreach (var pi in propertyInfos)
                    {
                        ApiParameter prop = MakeParameter(pi.PropertyType);
                        prop.Name = pi.Name;
                        ct.Properties.Add(prop);

                        AddToComplexTypesList(list, prop);
                    }
                }
            }
        }


        private static List<ApiParameter> GetRouteParameters(ApiDescription desc)
        {

            return desc.ParameterDescriptions.Where(d => d.Source == ApiParameterSource.FromUri &&
                                                  desc.Route.RouteTemplate.IndexOf("{" + d.Name + "}",
                                                      StringComparison.InvariantCultureIgnoreCase) >= 0)
                .Select(MakeParameter).ToList();
            
        }

        private static List<ApiParameter> GetQueryParameters(ApiDescription desc)
        {

            return desc.ParameterDescriptions.Where(d => d.Source == ApiParameterSource.FromUri &&
                                                  desc.Route.RouteTemplate.IndexOf("{" + d.Name + "}",
                                                      StringComparison.InvariantCultureIgnoreCase) < 0)
                .Select(MakeParameter).ToList();
            
        }
        private static ApiParameter GetBodyParameter(ApiDescription desc)
        {

            return desc.ParameterDescriptions.Where(d => d.Source == ApiParameterSource.FromBody )
                .Select(MakeParameter).FirstOrDefault();
            
        }

        private static ApiParameter MakeParameter(ApiParameterDescription apd)
        {
            Type ptype = apd.ParameterDescriptor.ParameterType;
            ApiParameter p = MakeParameter(ptype);
            p.Name = apd.Name;
            return p;

        }

        private static ApiParameter MakeParameter(Type type)
        {
            Type actualType = type.ListedType() ?? type.DictionariedType() ?? type;
            _typeCache[actualType.FullName] = actualType;
            var p = new ApiParameter()
            {
                TypeName = actualType.FullName,
                IsDictionary = type.IsDictionary(),
                IsList = type.ListedType() != null,
                IsSimple = actualType.IsSimpleType()
            };

            if (p.IsDictionary)
            {
                p.TypeName = null;

                if (type.GenericTypeArguments.Length == 2)
                {
                    p.KeyTypeName = type.GenericTypeArguments[0].FullName;
                    p.ValueTypeName = type.GenericTypeArguments[1].FullName;
                }
            }

            return p;
           
        }


        public static bool IsSimpleType(this Type typeToCheck)
        {
            var t = Nullable.GetUnderlyingType(typeToCheck) ?? typeToCheck;

            return t.IsPrimitive || t == typeof(string) || t == typeof(DateTime) || t == typeof(TimeSpan) || t == typeof(decimal);

        }

        /// <summary>
        /// Determines whether the specified type to check is dictionary.
        /// </summary>
        /// <param name="typeToCheck">The type to check.</param>
        /// <returns></returns>
        public static bool IsDictionary(this Type typeToCheck)
        {
            return (typeToCheck.IsGenericType && typeof(IDictionary<,>).IsAssignableFrom(typeToCheck.GetGenericTypeDefinition())) || typeof(IDictionary).IsAssignableFrom(typeToCheck);

        }

        public static Type DictionariedType(this Type t)
        {
            if (t.IsDictionary())
            {
                return t.GenericTypeArguments[1];
            }

            return null;
        }

        /// <summary>
        /// if t is a list returns the type that t is a list of (like an array or generic list)
        /// </summary>
        /// <param name="t">The t.</param>
        /// <returns></returns>
        public static Type ListedType(this Type t)
        {
            Type listed = null;

            if (t.IsArray)
            {
                listed = t.GetElementType();
            }
            else if (typeof(IEnumerable).IsAssignableFrom(t) && t.GenericTypeArguments.Length == 1)
            {
                listed = t.GenericTypeArguments[0];
            }

            return listed;
        }


        /// <summary>
        /// Generates an URI-friendly ID for the <see cref="ApiDescription"/>. E.g. "Get-Values-id_name" instead of "GetValues/{id}?name={name}"
        /// </summary>
        /// <param name="description">The <see cref="ApiDescription"/>.</param>
        /// <returns>The ID as a string.</returns>
        public static string GetFriendlyId(this ApiDescription description)
        {
            string path = description.RelativePath;
            string[] urlParts = path.Split('?');
            string localPath = urlParts[0];
            string queryKeyString = null;
            if (urlParts.Length > 1)
            {
                string query = urlParts[1];
                string[] queryKeys = HttpUtility.ParseQueryString(query).AllKeys;
                queryKeyString = String.Join("_", queryKeys);
            }

            StringBuilder friendlyPath = new StringBuilder();
            friendlyPath.AppendFormat("{0}-{1}",
                description.HttpMethod.Method,
                localPath.Replace("/", "-").Replace("{", String.Empty).Replace("}", String.Empty));
            if (queryKeyString != null)
            {
                friendlyPath.AppendFormat("_{0}", queryKeyString.Replace('.', '-'));
            }
            return friendlyPath.ToString();
        }

    }
}
