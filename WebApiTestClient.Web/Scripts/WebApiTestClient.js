(function() {

    var apiDescription = null;

   getJson("/WebApiTestClient.axd", function(data) {
       findThisApi(data);
   });


    function findThisApi(apis) {
        
        var apiId = window.location.pathname.split('/').pop();

        var found = apis.ApiNames.filter(function(n) {
            return n == apiId;
        });

        if (found.length) {
            console.log(found[0]);

            getJson("/WebApiTestClient.axd?ApiName=" + found[0], getReadyToUseTestClient);
        }

    }

    function getReadyToUseTestClient(data) {
        apiDescription = data;
        console.dir(data);
        addStyle();
        makeActivatorButton();


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

    function makeActivatorButton() {
        var a = document.createElement("A");
        a.className = "watc-activator";
        dom.text(a, "Test this API");
        a.setAttribute("href", "#test");
        a.addEventListener("click", function(ev) {
            ev.preventDefault();
            getTemplate(showUi);
            a.parentNode.removeChild(a);
            console.log("show the ui");

        });

        document.body.appendChild(a);
    }

    function showUi() {
        var panel = document.createElement('div');
        panel.setAttribute('id', 'watc-panel');
        panel.innerHTML = document.getElementById('tpl-watc-container').innerHTML;
        document.body.appendChild(panel);

        dom.text('watc-method', apiDescription.Method);
        dom.text('watc-route', apiDescription.Route);
        addRouteParams();
    }

    function addRouteParams() {
        apiDescription.RouteParameters.forEach(function(p) {
            addLabeledInput('$rp.',p, dom.gid('watc-routeparams'));
        });
    }
    function addLabeledInput(idprefix, param, container) {
        var panel = document.createElement('div');
        var tpl = dom.gid('tpl-watc-labeled-input').innerHTML;
        tpl = tpl.replace('{{label-id}}', idprefix + param.Name + '-labelcontainer')
          .replace('{{input-id}}', idprefix + param.Name + '-inputcontainer');
        panel.innerHTML = tpl;
        container.appendChild(panel);
        dom.text(idprefix + param.Name + '-labelcontainer', param.Name);

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


    var dom = {
        gid: function(id) {
            return document.getElementById(id);
        },


        text: function (el, text) {
            el = typeof(el) == "string" ? this.gid(el) : el;
            el.appendChild(document.createTextNode(text));
        }
}


})();