(function() {

    var apiDescription = null;

    //the name of the api is the last segment of the url. 
    var apiId = window.location.pathname.split('/').pop();
    getJson("/WebApiTestClient.axd?ApiName=" + apiId, getReadyToUseTestClient);


    function getReadyToUseTestClient(data) {
        apiDescription = data;
        setUpApiDescForUi();
        console.dir(data);
        dom.el("link", {"href": "/Content/WebApiTestClient/styles.css","rel":"stylesheet","type": "text/css"}, document.head);
            dom.el("script", { "src": "//cdnjs.cloudflare.com/ajax/libs/handlebars.js/2.0.0/handlebars.min.js", "type": "text/javascript" }, document.head);
        makeActivatorButton();


    }

    function setUpApiDescForUi() {
        apiDescription.QueryParameters.forEach(function(p) {
            p.id = "$qp." + p.Name;
        });
        apiDescription.RouteParameters.forEach(function(p) {
            p.id = "$rp." + p.Name;
        });

        if (apiDescription.BodyParameter) {
            apiDescription.BodyParameter.id = apiDescription.BodyParameter.Name;
            if (apiDescription.BodyParameter.IsList) {
                apiDescription.BodyParameter.id = apiDescription.BodyParameter.id + "[0]";
            }

        }
    }


    function makeActivatorButton() {
        var a = dom.el("A", {'class':"watc-activator","href": "#test"}, document.body);

        dom.text(a, "Test this API");

        a.addEventListener("click", function (ev) {
            ev.preventDefault();
            getTemplate(showUi);
            a.parentNode.removeChild(a);
            console.log("show the ui");

        });

    }

    function showUi() {
        configHandlebars();

        var html = templates['container'](apiDescription);
        dom.html(html, document.body);

        if (apiDescription.BodyParameter && !apiDescription.BodyParameter.IsSimple) {
            addProperties(apiDescription.BodyParameter.id,apiDescription.BodyParameter.TypeName);
        }

        dom.gid('watc-panel').addEventListener("click", clickHandler);
    }


    function addProperties(id, typeName) {
        if (typeName) {
            var type = apiDescription.ComplexTypes.filter(function(t) {
                return t.Name == typeName;
            });
            if (type.length) {
                type = type[0];

                type.Properties.forEach(function(p) {
                    p.id = id + "." + p.Name;
                })

                var html = templates['complex-type-properties'](type);

                dom.html(html, dom.gid(id + '.properties'));
            }
        }
    }


    function clickHandler(ev) {
        var cmd = ev.target.getAttribute("data-cmd");
        if (cmd && commands[cmd]) {
            ev.preventDefault();
            commands[cmd](ev.target);
        }
    }

    function configHandlebars() {

        [].forEach.call(document.querySelectorAll("script[type='text/html']"), function(t) {

            var name = t.getAttribute("id").replace("tpl-watc-", "");

            templates[name] = Handlebars.compile(t.innerHTML);
            Handlebars.registerPartial(name, templates[name]);
        });

    }


    var templates = {};


    var commands = {
        inputListRemove:function(el) {
            var inputs = el.parentNode.querySelectorAll("input");
            if (inputs.length == 1) {
                return;
            }
            var last = inputs[inputs.length - 1];

            el.parentNode.removeChild(last.previousSibling);

            el.parentNode.removeChild(last);
        },
        inputListAdd:function(el) {
            var inputs = el.parentNode.querySelectorAll("input");
            var insertPoint = inputs[inputs.length - 1].nextSibling;
            var newInput = inputs[inputs.length - 1].cloneNode();
            newInput.value = null;

            el.parentNode.insertBefore(document.createTextNode(", "), insertPoint);
            el.parentNode.insertBefore(newInput, insertPoint);
        },

        complexListAdd:function(el) {
            var typeName = el.getAttribute("data-type-name");
            var id = el.getAttribute("data-id");
            //id will have [0] at end.  Need to get the last div so that the new one can have the next index.
            var divs = [].filter.call(el.parentNode.childNodes, function(n) {
                return n.nodeName.toLowerCase() == 'div';
            });
            var last;
            if (divs.length) {
                last = divs[divs.length - 1];
            }

            var idx = last == null ? 0 : divs.length;
            var newId = id.substring(0, id.lastIndexOf("[")) + "[" + idx + "]";

            var html = templates["complex-type"]({ id: newId });
            if (idx > 0) {
                html = "<span class='comma'>, </span>" + html;
            }
            var insertPoint = last == null ? el.parentNode.firstChild : last.nextSibling;

            dom.html(html, el.parentNode, insertPoint);

            addProperties(newId, typeName);
            //these are the existing objects.
        },
        complexListRemove:function(el) {
            var divs = [].filter.call(el.parentNode.childNodes, function (n) {
                return n.nodeName.toLowerCase() == 'div';
            });

            if (divs.length ) {
                var last = divs[divs.length - 1];
                
                while (last.previousSibling && last.previousSibling.nodeName.toLowerCase() != "div") {
                    last.parentNode.removeChild(last.previousSibling);
                }

                last.parentNode.removeChild(last);
            }

        },
        innerComplexPropery:function(el) {

            var id = el.getAttribute("data-id");
            var typeName = el.getAttribute("data-type-name");

            addProperties(id, typeName);

            el.parentElement.removeChild(el);

        }
    }

    var dom = {
        //get an element by ID
        gid: function(id) {
            return document.getElementById(id);
        },

        //add text to an element
        text: function (el, text) {
            el = typeof(el) == "string" ? this.gid(el) : el;
            el.appendChild(document.createTextNode(text));
        },

        //create an element
        el: function(nodeType, attrs, parent) {
            var el = document.createElement(nodeType);
            if (attrs) {
                for (var attr in attrs) {
                    el.setAttribute(attr, attrs[attr]);
                }
            }
            if (parent) {
                parent.appendChild(el);
            }
            return el;
        },

        //append html to an element or insert it before
        html:function(html, parent, insertPoint) {
            var d = this.el('div');
            d.innerHTML = html;
            while (d.firstChild) {
                if (insertPoint) {
                    parent.insertBefore(d.firstChild, insertPoint);
                } else {
                    parent.appendChild(d.firstChild);
                }
            }
        }
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



    function getJson(url, callback) {

        var xhr = new XMLHttpRequest();

        xhr.onload = function () {

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


})();