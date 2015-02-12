using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace WebApiTestClient.Web.Controllers
{
    public class TestRestRoutesController : ApiController
    {

        public IEnumerable<Person> Get()
        {
            return new Person[0];
        }

        public Person Get(int id)
        {
            return new Person();
        }

        public void Post(Person p)
        {
            
        }

        public void Put(int id, Person p)
        {
            
        }

        public void Delete(int id)
        {
            
        }

    }



    public class Person
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public DateTime BirthDate { get; set; }

        public bool IsEmployed { get; set; }
    }
}