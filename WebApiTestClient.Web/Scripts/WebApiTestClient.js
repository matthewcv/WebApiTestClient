(function() {

   getJson("/WebApiTestClient.axd", function(data) {
       console.dir(data);
       findThisApi(data);
   });


    function findThisApi(apis) {
        
        var apiId = window.location.pathname.split('/').pop();

        var found = apis.ApiNames.filter(function(n) {
            return n == apiId
        });

        if (found.length) {
            console.log(found[0]);

            getJson("/WebApiTestClient.axd?ApiName=" + found[0], generateUi);
        }

    }

    function generateUi(data) {

        addStyle();
        makeButton();


        console.dir(data);
    }


function getJson(url, callback) {

    var xhr = new XMLHttpRequest();

    xhr.onload = function() {
        
        if (xhr.status == 200) {
            var data = JSON.parse(xhr.response);

            callback(data);
        } else {
            console.log("AJAX ERROR getJson");
            console.dir(xhr);
        }

    }

    xhr.open("GET", url);
    xhr.send();
}

    function addStyle() {
        var link = document.createElement("link");
        link.setAttribute("href", "/Content/WebApiTestClient/styles.css");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        document.head.appendChild(link);
    }

    function makeButton() {
        var a = document.createElement("A");
        a.className = "watc-activator";
        a.appendChild(document.createTextNode("Test this API"));
        a.setAttribute("href", "#test");
        a.addEventListener("click", function(ev) {
            ev.preventDefault();

            console.log("show the ui");

        });

        document.body.appendChild(a);
    }

    function getTemplate(callback) {

        var xhr = new XMLHttpRequest();

        xhr.onload = function () {

            if (xhr.status == 200) {

                var templates = document.createElement("DIV");
                templates.innerHTML = xhr.response;
                document.body.appendChild(templates);
                callback();

            } else {
                console.log("AJAX ERROR getTemplate");
                console.dir(xhr);
            }

        }

        xhr.open("GET", "/Content/WebApiTestClient/views.html");
        xhr.send();
    }


})();